<?php
/**
 * Client HTTP chỉ-GET cho CMS Hải Vân (cms.haivan.com) dùng bởi import-cms.php.
 *
 * Quy tắc an toàn:
 *  - chỉ phương thức GET (không có đường nào gửi POST/PUT/DELETE/HEAD), chỉ host trong allowlist, chỉ https;
 *  - tuần tự (không song song), giãn cách giữa hai request, tôn trọng header x-ratelimit-*, Retry-After;
 *  - thử lại có backoff khi lỗi mạng / 5xx / 429; 4xx khác không thử lại;
 *  - JSON thô lưu ở thư mục cache để chạy lại không tải lại.
 *
 * Lưu ý máy chủ CMS: GET chi tiết bài tăng views_count (và updated_at) phía CMS, giống một lượt xem của khách;
 * vì vậy bản chi tiết chỉ được tải khi chưa có trong cache hoặc dấu vân tay danh sách đổi.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

final class HV_Cms_Client {

	/** Host cho phép (API + tài nguyên tĩnh). */
	const ALLOWED_HOSTS = array( 'cms.haivan.com', 'haivan.com', 'www.haivan.com' );

	/** @var string */
	public $base = 'https://cms.haivan.com/';
	/** @var string */
	public $cache_dir;
	/** @var int Giãn cách tối thiểu giữa hai request API (ms). */
	public $api_delay_ms;
	/** @var int Giãn cách tối thiểu giữa hai request tệp tĩnh/ảnh (ms). */
	public $file_delay_ms;
	/** @var bool Chỉ đọc cache, không gọi mạng. */
	public $offline;
	/** @var bool Bỏ qua cache chi tiết (tải lại). */
	public $refresh;
	/** @var bool Khi offline vẫn cho tải ảnh/tệp (JSON vẫn chỉ đọc cache). */
	public $files_online;
	/** @var array<string,mixed> */
	public $stats = array(
		'requests'   => 0,
		'cache_hits' => 0,
		'retries'    => 0,
		'bytes'      => 0,
		'failed'     => array(), // url => lý do
	);

	/** @var float */
	private $last_end = 0.0;
	/** @var int|null */
	private $rl_remaining = null;

	/**
	 * @param array<string,mixed> $o cache_dir, api_delay_ms, file_delay_ms, offline, refresh.
	 */
	public function __construct( array $o ) {
		$this->cache_dir     = rtrim( (string) $o['cache_dir'], '/' );
		$this->api_delay_ms  = max( 0, (int) ( $o['api_delay_ms'] ?? 1200 ) );
		$this->file_delay_ms = max( 0, (int) ( $o['file_delay_ms'] ?? 250 ) );
		$this->offline       = ! empty( $o['offline'] );
		$this->refresh       = ! empty( $o['refresh'] );
		$this->files_online  = ! empty( $o['files_online'] );
		if ( ! is_dir( $this->cache_dir ) && ! wp_mkdir_p( $this->cache_dir ) ) {
			WP_CLI::error( 'Không tạo được thư mục cache: ' . $this->cache_dir );
		}
	}

	/** URL tuyệt đối thuộc allowlist, https. */
	public static function url_allowed( $url ) {
		$p = wp_parse_url( (string) $url );
		return ! empty( $p['scheme'] ) && 'https' === strtolower( $p['scheme'] )
			&& ! empty( $p['host'] ) && in_array( strtolower( $p['host'] ), self::ALLOWED_HOSTS, true );
	}

	/** Đường dẫn tệp cache cho (nhóm, khoá). Tên an toàn, cắt ngắn + băm khi dài/đổi ký tự. */
	public function cache_path( $group, $key, $ext = 'json' ) {
		$safe = preg_replace( '/[^A-Za-z0-9._-]/', '_', (string) $key );
		if ( $safe !== (string) $key || strlen( $safe ) > 120 ) {
			$safe = substr( $safe, 0, 100 ) . '-' . substr( md5( (string) $key ), 0, 10 );
		}
		return $this->cache_dir . '/' . $group . '/' . $safe . '.' . $ext;
	}

	/** Ghi nguyên tử. */
	public function write_file( $path, $data ) {
		$dir = dirname( $path );
		if ( ! is_dir( $dir ) && ! wp_mkdir_p( $dir ) ) {
			return false;
		}
		$tmp = $path . '.tmp' . getmypid();
		if ( false === file_put_contents( $tmp, $data ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions
			return false;
		}
		return rename( $tmp, $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	}

	/**
	 * Đọc JSON từ cache (không gọi mạng).
	 *
	 * @return array<mixed>|null
	 */
	public function cached_json( $group, $key ) {
		$f = $this->cache_path( $group, $key );
		if ( ! is_file( $f ) ) {
			return null;
		}
		$d = json_decode( (string) file_get_contents( $f ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		return is_array( $d ) ? $d : null;
	}

	/** Tuổi tệp cache (giây), null nếu chưa có. */
	public function cache_age( $group, $key ) {
		$f = $this->cache_path( $group, $key );
		return is_file( $f ) ? time() - (int) filemtime( $f ) : null;
	}

	/**
	 * GET một đường dẫn API và trả mảng JSON; ghi cache thô (group/key). Trả null khi 404/lỗi.
	 * Offline: chỉ trả từ cache.
	 *
	 * @param string $path  Đường dẫn + query, vd. "api/location/ha-noi?page=2".
	 * @param string $group Nhóm cache.
	 * @param string $key   Khoá cache.
	 * @return array<mixed>|null
	 */
	public function api_json( $path, $group, $key ) {
		if ( $this->offline ) {
			return $this->cached_json( $group, $key );
		}
		$res = $this->get( $this->base . ltrim( $path, '/' ), true );
		if ( 200 !== $res['status'] ) {
			$this->stats['failed'][ $path ] = 'HTTP ' . $res['status'] . ( $res['error'] ? ' ' . $res['error'] : '' );
			return null;
		}
		$d = json_decode( $res['body'], true );
		if ( ! is_array( $d ) ) {
			$this->stats['failed'][ $path ] = 'JSON hỏng';
			return null;
		}
		$this->write_file( $this->cache_path( $group, $key ), $res['body'] );
		return $d;
	}

	/**
	 * Tải chi tiết có dùng cache: dùng lại bản cache khi còn hợp lệ.
	 * Hợp lệ = tệp tồn tại, không refresh, dấu vân tay khớp (nếu có), chưa quá TTL (nếu có).
	 *
	 * @param string      $path        API path.
	 * @param string      $group       Nhóm cache.
	 * @param string      $key         Khoá cache.
	 * @param string      $fingerprint Dấu vân tay hiện tại ('' = bỏ qua so khớp).
	 * @param array       $fp_store    Kho dấu vân tay (tham chiếu), key = "$group/$key".
	 * @param int         $ttl         Giây; 0 = không hết hạn.
	 * @return array<mixed>|null
	 */
	public function api_detail( $path, $group, $key, $fingerprint, array &$fp_store, $ttl = 0 ) {
		$have = $this->cached_json( $group, $key );
		$id   = $group . '/' . $key;
		if ( null !== $have && ! $this->refresh ) {
			$fp_ok  = '' === $fingerprint || ( $fp_store[ $id ] ?? '' ) === $fingerprint;
			$ttl_ok = 0 === $ttl || ( $this->cache_age( $group, $key ) ?? PHP_INT_MAX ) <= $ttl;
			if ( $this->offline || ( $fp_ok && $ttl_ok ) ) {
				++$this->stats['cache_hits'];
				return $have;
			}
		}
		if ( $this->offline ) {
			return null;
		}
		$d = $this->api_json( $path, $group, $key );
		if ( null === $d ) {
			return $have; // lỗi mạng: dùng bản cũ nếu có (đã ghi vào failed).
		}
		if ( '' !== $fingerprint ) {
			$fp_store[ $id ] = $fingerprint;
		}
		return $d;
	}

	/**
	 * Tải tệp (ảnh) về tệp tạm. Trả [status, đường dẫn tạm|null, content-type, lỗi].
	 *
	 * @param string $url URL tuyệt đối thuộc allowlist.
	 * @return array{status:int,tmp:?string,type:string,error:string}
	 */
	public function download( $url ) {
		$tmp = wp_tempnam( 'hvcms' );
		if ( ! $tmp ) {
			return array( 'status' => 0, 'tmp' => null, 'type' => '', 'error' => 'không tạo được tệp tạm' );
		}
		$res = $this->get( $url, false, $tmp );
		if ( 200 !== $res['status'] ) {
			wp_delete_file( $tmp );
			return array( 'status' => $res['status'], 'tmp' => null, 'type' => '', 'error' => $res['error'] );
		}
		return array( 'status' => 200, 'tmp' => $tmp, 'type' => $res['type'], 'error' => '' );
	}

	/**
	 * Đo kích thước tệp mà không tải cả tệp: GET kèm "Range: bytes=0-0" (không dùng HEAD). Máy chủ bỏ qua Range
	 * thì ngắt kết nối ngay sau header.
	 *
	 * @param string $url URL tuyệt đối thuộc allowlist.
	 * @return array{status:int,bytes:int,type:string,error:string}
	 */
	public function probe_size( $url ) {
		if ( ! self::url_allowed( $url ) ) {
			return array( 'status' => 0, 'bytes' => 0, 'type' => '', 'error' => 'host không cho phép' );
		}
		$this->pace( false );
		$status = 0;
		$bytes  = 0;
		$type   = '';
		$ch     = curl_init( $url );
		curl_setopt_array(
			$ch,
			array(
				CURLOPT_HTTPGET        => true,
				CURLOPT_FOLLOWLOCATION => true,
				CURLOPT_MAXREDIRS      => 3,
				CURLOPT_PROTOCOLS      => CURLPROTO_HTTPS,
				CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
				CURLOPT_CONNECTTIMEOUT => 15,
				CURLOPT_TIMEOUT        => 30,
				CURLOPT_USERAGENT      => $this->user_agent(),
				CURLOPT_HTTPHEADER     => array( 'Range: bytes=0-0', 'Accept: */*' ),
				CURLOPT_HEADERFUNCTION => static function ( $c, $line ) use ( &$status, &$bytes, &$type ) {
					if ( preg_match( '#^HTTP/\S+\s+(\d{3})#', $line, $m ) ) {
						$status = (int) $m[1];
						$bytes  = 0;
					} elseif ( preg_match( '#^content-range:\s*bytes\s+\d+-\d+/(\d+)#i', $line, $m ) ) {
						$bytes = (int) $m[1];
					} elseif ( preg_match( '#^content-length:\s*(\d+)#i', $line, $m ) && 0 === $bytes && 200 === $status ) {
						$bytes = (int) $m[1];
					} elseif ( preg_match( '#^content-type:\s*([^;\r\n]+)#i', $line, $m ) ) {
						$type = strtolower( trim( $m[1] ) );
					}
					return strlen( $line );
				},
				CURLOPT_WRITEFUNCTION  => static function () {
					return 0; // 200 (bỏ qua Range) hoặc 206: ngắt, ta chỉ cần header.
				},
			)
		);
		curl_exec( $ch );
		$errno = curl_errno( $ch );
		$err   = curl_error( $ch );
		curl_close( $ch );
		$this->last_end = microtime( true );
		++$this->stats['requests'];
		// errno 23 (write error) là kết quả mong đợi khi ta ngắt sau header.
		if ( $status < 100 && 0 !== $errno && 23 !== $errno ) {
			return array( 'status' => 0, 'bytes' => 0, 'type' => $type, 'error' => $err );
		}
		return array( 'status' => $status, 'bytes' => $bytes, 'type' => $type, 'error' => '' );
	}

	/**
	 * GET có thử lại. $dest: ghi thân phản hồi vào tệp thay vì chuỗi.
	 *
	 * @return array{status:int,body:string,type:string,error:string}
	 */
	private function get( $url, $api, $dest = '' ) {
		if ( ! self::url_allowed( $url ) ) {
			return array( 'status' => 0, 'body' => '', 'type' => '', 'error' => 'host không cho phép' );
		}
		$backoff = array( 2, 6, 15, 40 );
		$attempt = 0;
		$last    = array( 'status' => 0, 'body' => '', 'type' => '', 'error' => '' );
		while ( true ) {
			$this->pace( $api );
			$last = $this->curl_get( $url, $api, $dest );
			++$this->stats['requests'];
			$this->last_end = microtime( true );
			$s              = $last['status'];
			if ( 200 === $s || ( $s >= 400 && $s < 500 && 429 !== $s ) ) {
				return $last; // thành công hoặc lỗi 4xx cuối cùng (404 = không có).
			}
			if ( $attempt >= count( $backoff ) ) {
				return $last;
			}
			$wait = 429 === $s ? max( (int) ( $last['retry_after'] ?? 0 ), 30 ) : $backoff[ $attempt ];
			++$attempt;
			++$this->stats['retries'];
			WP_CLI::debug( "GET $url -> $s {$last['error']}; thử lại sau {$wait}s ($attempt)", 'hv-cms' );
			sleep( $wait );
		}
	}

	/** Giãn cách tối thiểu + tuân thủ giới hạn tốc độ của CMS. */
	private function pace( $api ) {
		if ( $api && null !== $this->rl_remaining && $this->rl_remaining <= 3 ) {
			sleep( 20 ); // cửa sổ giới hạn là 1 phút; chờ một phần rồi đi tiếp.
			$this->rl_remaining = null;
		}
		$delay = $api ? $this->api_delay_ms : $this->file_delay_ms;
		if ( $this->last_end > 0 ) {
			$wait = $delay - ( microtime( true ) - $this->last_end ) * 1000;
			if ( $wait > 0 ) {
				usleep( (int) ( $wait * 1000 ) );
			}
		}
	}

	private function user_agent() {
		return 'HaiVanWeb-ContentMigration/1.0 (read-only; contact: web team)';
	}

	/**
	 * Một lần GET bằng curl.
	 *
	 * @return array{status:int,body:string,type:string,error:string,retry_after?:int}
	 */
	private function curl_get( $url, $api, $dest ) {
		$status      = 0;
		$type        = '';
		$retry_after = 0;
		$fh          = null;
		if ( '' !== $dest ) {
			$fh = fopen( $dest, 'wb' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
			if ( ! $fh ) {
				return array( 'status' => 0, 'body' => '', 'type' => '', 'error' => 'không mở được tệp tạm' );
			}
		}
		$headers = array( 'Accept: ' . ( $api ? 'application/json' : '*/*' ) );
		if ( $api ) {
			$headers[] = 'Domain: haivan.com'; // như web cũ; một số endpoint (get-news) trả 404 nếu thiếu.
		}
		$ch = curl_init( $url );
		$o  = array(
			CURLOPT_HTTPGET         => true,
			CURLOPT_FOLLOWLOCATION  => true,
			CURLOPT_MAXREDIRS       => 3,
			CURLOPT_PROTOCOLS       => CURLPROTO_HTTPS,
			CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
			CURLOPT_CONNECTTIMEOUT  => 15,
			CURLOPT_TIMEOUT         => $api ? 90 : 120,
			CURLOPT_ENCODING        => '', // gzip/deflate.
			CURLOPT_USERAGENT       => $this->user_agent(),
			CURLOPT_HTTPHEADER      => $headers,
			CURLOPT_HEADERFUNCTION  => function ( $c, $line ) use ( &$status, &$type, &$retry_after ) {
				if ( preg_match( '#^HTTP/\S+\s+(\d{3})#', $line, $m ) ) {
					$status = (int) $m[1];
				} elseif ( preg_match( '#^content-type:\s*([^;\r\n]+)#i', $line, $m ) ) {
					$type = strtolower( trim( $m[1] ) );
				} elseif ( preg_match( '#^retry-after:\s*(\d+)#i', $line, $m ) ) {
					$retry_after = (int) $m[1];
				} elseif ( preg_match( '#^x-ratelimit-remaining:\s*(\d+)#i', $line, $m ) ) {
					$this->rl_remaining = (int) $m[1];
				}
				return strlen( $line );
			},
		);
		if ( $fh ) {
			$o[ CURLOPT_FILE ] = $fh;
		} else {
			$o[ CURLOPT_RETURNTRANSFER ] = true;
		}
		curl_setopt_array( $ch, $o );
		$body  = curl_exec( $ch );
		$errno = curl_errno( $ch );
		$err   = curl_error( $ch );
		$size  = (int) curl_getinfo( $ch, CURLINFO_SIZE_DOWNLOAD );
		curl_close( $ch );
		if ( $fh ) {
			fclose( $fh ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		}
		$this->stats['bytes'] += $size;
		if ( 0 !== $errno ) {
			return array( 'status' => 0, 'body' => '', 'type' => $type, 'error' => "curl $errno: $err", 'retry_after' => $retry_after );
		}
		return array(
			'status'      => $status,
			'body'        => is_string( $body ) ? $body : '',
			'type'        => $type,
			'error'       => '',
			'retry_after' => $retry_after,
		);
	}
}
