<?php
/**
 * Ảnh/tệp của CMS -> thư viện Media của WP, có dedupe theo URL nguồn, và viết lại URL trong nội dung bài.
 *
 * - Chuẩn hoá URL: đường dẫn tương đối / "//" kép / ký tự có dấu -> URL https tuyệt đối đã mã hoá từng đoạn
 *   (cùng dạng với các ảnh đã nhập trước đó bởi import-old-site.php để dedupe khớp).
 * - Chỉ tải từ host của Hải Vân (HV_Cms_Client::ALLOWED_HOSTS). Ảnh host khác giữ nguyên URL (đếm để báo cáo).
 * - Dedupe: meta hv_import_source của attachment (nạp một lần vào bộ nhớ).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/cms-client.php';
require_once __DIR__ . '/sanitize.php';

/** Đuôi ảnh được tải. */
const HVC_IMAGE_EXT = 'jpe?g|jfif|png|gif|webp|avif|bmp';
/** Đuôi tệp tài liệu đính kèm trong bài (liên kết <a href>) cũng được đưa vào Media. */
const HVC_DOC_EXT = 'pdf|docx?|xlsx?|pptx?|zip';

/**
 * URL tuyệt đối đã chuẩn hoá của một tài nguyên CMS, hoặc null nếu không phải host Hải Vân / không hợp lệ.
 *
 * @param string $raw   Giá trị src/href hoặc đường dẫn ảnh CMS ("/userfiles/photos/1/a b.png", "images/x.jpg").
 * @param bool   $strict Chỉ chấp nhận khi đã có host (dùng cho nội dung bài); false: đường dẫn tương đối coi là của CMS.
 */
function hvc_asset_url( $raw, $strict = false ) {
	$raw = trim( html_entity_decode( (string) $raw, ENT_QUOTES, 'UTF-8' ) );
	if ( '' === $raw || 'None' === $raw || 0 === stripos( $raw, 'data:' ) || 0 === stripos( $raw, 'blob:' ) ) {
		return null;
	}
	if ( 0 === strpos( $raw, '//' ) ) {
		$raw = 'https:' . $raw;
	}
	$host = '';
	$path = '';
	$qs   = '';
	if ( preg_match( '#^https?://#i', $raw ) ) {
		$p = wp_parse_url( $raw );
		if ( empty( $p['host'] ) ) {
			return null;
		}
		$host = strtolower( $p['host'] );
		$path = (string) ( $p['path'] ?? '/' );
		$qs   = isset( $p['query'] ) && '' !== $p['query'] ? '?' . $p['query'] : '';
		// api.haivan.com là host cũ đã tắt của cùng kho tệp: /photos/<tệp> nay nằm ở cms.haivan.com/photos/<tệp>.
		if ( 'api.haivan.com' === $host ) {
			$host = 'cms.haivan.com';
		}
		if ( ! in_array( $host, HV_Cms_Client::ALLOWED_HOSTS, true ) ) {
			return null;
		}
	} elseif ( $strict || preg_match( '#^[a-z][a-z0-9+.-]*:#i', $raw ) ) {
		// Nội dung bài: "/userfiles/.." (tuyệt đối theo host) là của CMS; "mailto:", "tel:" ... thì không.
		if ( preg_match( '#^[a-z][a-z0-9+.-]*:#i', $raw ) || 0 !== strpos( $raw, '/' ) ) {
			return null;
		}
		$host = 'cms.haivan.com';
		$bits = explode( '?', $raw, 2 );
		$path = $bits[0];
		$qs   = isset( $bits[1] ) && '' !== $bits[1] ? '?' . $bits[1] : '';
	} else {
		$host = 'cms.haivan.com';
		$bits = explode( '?', $raw, 2 );
		$path = $bits[0];
		$qs   = isset( $bits[1] ) && '' !== $bits[1] ? '?' . $bits[1] : '';
	}
	$path = '/' . ltrim( preg_replace( '#/{2,}#', '/', $path ), '/' );
	$segs = array_map(
		static function ( $s ) {
			return rawurlencode( rawurldecode( $s ) );
		},
		explode( '/', $path )
	);
	$path = implode( '/', $segs );
	if ( '/' === $path ) {
		return null;
	}
	return 'https://' . $host . $path . $qs;
}

/** Đuôi (chữ thường) của đường dẫn URL, '' nếu không có. */
function hvc_url_ext( $url ) {
	$path = (string) wp_parse_url( (string) $url, PHP_URL_PATH );
	return strtolower( (string) pathinfo( rawurldecode( $path ), PATHINFO_EXTENSION ) );
}

/** Có phải URL ảnh (theo đuôi)? */
function hvc_is_image_url( $url ) {
	return 1 === preg_match( '/^(' . HVC_IMAGE_EXT . ')$/', hvc_url_ext( $url ) );
}

/** Có phải URL tài liệu (theo đuôi)? */
function hvc_is_doc_url( $url ) {
	return 1 === preg_match( '/^(' . HVC_DOC_EXT . ')$/', hvc_url_ext( $url ) );
}

/**
 * Liệt kê tài nguyên trong HTML nội dung.
 *
 * @param string $html Nội dung.
 * @return array{images:string[],docs:string[],external:string[]} URL chuẩn hoá (images/docs thuộc Hải Vân), external = ảnh host khác.
 */
function hvc_content_assets( $html ) {
	$out = array( 'images' => array(), 'docs' => array(), 'external' => array() );
	if ( '' === (string) $html ) {
		return $out;
	}
	if ( preg_match_all( '#<img\b[^>]*>#i', $html, $m ) ) {
		foreach ( $m[0] as $tag ) {
			$src = hvs_html_attr( $tag, 'src' );
			$n   = hvc_asset_url( $src, true );
			if ( $n ) {
				$out['images'][] = $n;
			} elseif ( preg_match( '#^(https?:)?//#i', trim( $src ) ) ) {
				$out['external'][] = trim( $src );
			}
		}
	}
	if ( preg_match_all( '#<a\b[^>]*>#i', $html, $m ) ) {
		foreach ( $m[0] as $tag ) {
			$n = hvc_asset_url( hvs_html_attr( $tag, 'href' ), true );
			if ( $n && hvc_is_image_url( $n ) ) {
				$out['images'][] = $n;
			} elseif ( $n && hvc_is_doc_url( $n ) ) {
				$out['docs'][] = $n;
			}
		}
	}
	return array_map( 'array_values', array_map( 'array_unique', $out ) );
}

/**
 * Quản lý tải về Media với dedupe.
 */
final class HV_Cms_Media {

	/** @var HV_Cms_Client */
	private $client;
	/** @var bool */
	public $enabled;
	/** @var array<string,int> URL nguồn -> attachment id. */
	private $map = array();
	/** @var array<string,string> URL nguồn -> lý do thất bại vĩnh viễn (404...). */
	private $failed = array();
	/** @var string */
	private $failed_file;
	/** @var bool */
	private $retry_failed;
	/** @var array<string,int> */
	public $stats = array(
		'downloaded' => 0,
		'bytes'      => 0,
		'reused'     => 0,
		'failed'     => 0,
		'skipped'    => 0,
		'external'   => 0,
	);
	/** @var array<string,string> URL -> lý do (lần chạy này). */
	public $errors = array();

	public function __construct( HV_Cms_Client $client, $enabled = true, $retry_failed = false ) {
		global $wpdb;
		$this->client       = $client;
		$this->enabled      = (bool) $enabled;
		$this->retry_failed = (bool) $retry_failed;
		$this->failed_file  = $client->cache_dir . '/image-failures.json';
		$rows               = $wpdb->get_results( "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = 'hv_import_source'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		foreach ( $rows as $r ) {
			$key = hvc_asset_url( $r->meta_value );
			if ( $key && ! isset( $this->map[ $key ] ) && 'attachment' === get_post_type( (int) $r->post_id ) ) {
				$this->map[ $key ] = (int) $r->post_id;
			}
		}
		if ( is_file( $this->failed_file ) ) {
			$f = json_decode( (string) file_get_contents( $this->failed_file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions
			if ( is_array( $f ) ) {
				$this->failed = $f;
			}
		}
	}

	/** Số attachment đã biết (dedupe). */
	public function known() {
		return count( $this->map );
	}

	/**
	 * Attachment id cho URL nguồn (tải nếu chưa có). 0 nếu không được.
	 *
	 * @param string $url   URL đã chuẩn hoá (hvc_asset_url).
	 * @param string $alt   Văn bản thay thế.
	 * @param bool   $doc   Cho phép tệp tài liệu (không chỉ ảnh).
	 */
	public function get( $url, $alt = '', $doc = false ) {
		if ( isset( $this->map[ $url ] ) ) {
			++$this->stats['reused'];
			return $this->map[ $url ];
		}
		if ( ! $this->enabled || ( $this->client->offline && ! $this->client->files_online ) ) {
			return 0;
		}
		if ( isset( $this->failed[ $url ] ) && ! $this->retry_failed ) {
			return 0;
		}
		if ( ! hvc_is_image_url( $url ) && ! ( $doc && hvc_is_doc_url( $url ) ) ) {
			// URL ảnh không đuôi (vd. /api/...): chỉ tải khi Content-Type là ảnh (kiểm sau khi tải).
			if ( '' !== hvc_url_ext( $url ) ) {
				++$this->stats['skipped'];
				$this->errors[ $url ] = 'đuôi không hỗ trợ: ' . hvc_url_ext( $url );
				return 0;
			}
		}
		$dl = $this->client->download( $url );
		if ( 200 !== $dl['status'] || ! $dl['tmp'] ) {
			++$this->stats['failed'];
			$why                  = $dl['status'] ? 'HTTP ' . $dl['status'] : $dl['error'];
			$this->errors[ $url ] = $why;
			if ( in_array( $dl['status'], array( 400, 403, 404, 410 ), true ) ) {
				$this->remember_failure( $url, $why );
			}
			return 0;
		}
		$size = (int) filesize( $dl['tmp'] );
		$name = $this->file_name( $url, $dl['type'] );
		if ( '' === $name ) {
			wp_delete_file( $dl['tmp'] );
			++$this->stats['skipped'];
			$this->errors[ $url ] = 'không xác định được tên/đuôi tệp (' . $dl['type'] . ')';
			$this->remember_failure( $url, $this->errors[ $url ] );
			return 0;
		}
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$ft = wp_check_filetype_and_ext( $dl['tmp'], $name );
		if ( empty( $ft['type'] ) ) {
			// Nội dung thật không khớp đuôi / WP không nhận định dạng: thử lại cũng vậy.
			wp_delete_file( $dl['tmp'] );
			++$this->stats['skipped'];
			$this->errors[ $url ] = 'định dạng tệp không được WP chấp nhận';
			$this->remember_failure( $url, $this->errors[ $url ] );
			return 0;
		}
		$id = media_handle_sideload( array( 'name' => $name, 'tmp_name' => $dl['tmp'] ), 0, '' );
		if ( is_wp_error( $id ) ) {
			wp_delete_file( $dl['tmp'] );
			++$this->stats['failed'];
			$this->errors[ $url ] = 'WP: ' . $id->get_error_message();
			return 0;
		}
		update_post_meta( $id, 'hv_import_source', $url );
		if ( '' !== $alt ) {
			update_post_meta( $id, '_wp_attachment_image_alt', hvs_clean_text( $alt ) );
		}
		$this->map[ $url ] = (int) $id;
		++$this->stats['downloaded'];
		$this->stats['bytes'] += $size;
		return (int) $id;
	}

	/** Ghi nhớ lỗi vĩnh viễn (không thử lại ở lần chạy sau, trừ HV_CMS_RETRY_FAILED=1). */
	private function remember_failure( $url, $why ) {
		$this->failed[ $url ] = $why;
		$this->client->write_file( $this->failed_file, (string) wp_json_encode( $this->failed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
	}

	/** Tên tệp an toàn (bỏ dấu), có đuôi. */
	private function file_name( $url, $content_type ) {
		$base = rawurldecode( basename( (string) wp_parse_url( $url, PHP_URL_PATH ) ) );
		$base = sanitize_file_name( remove_accents( $base ) );
		$base = preg_replace( '/\.jfif$/i', '.jpg', $base ); // WP không nhận đuôi .jfif.
		if ( preg_match( '/\.(' . HVC_IMAGE_EXT . '|' . HVC_DOC_EXT . ')$/i', $base ) ) {
			return $base;
		}
		$ext = array(
			'image/jpeg' => 'jpg',
			'image/png'  => 'png',
			'image/gif'  => 'gif',
			'image/webp' => 'webp',
			'image/avif' => 'avif',
			'image/bmp'  => 'bmp',
		)[ $content_type ] ?? '';
		return '' !== $ext && '' !== $base ? $base . '.' . $ext : '';
	}

	/**
	 * Viết lại URL ảnh/tài liệu trong HTML sang bản local; bỏ srcset/sizes của ảnh đã viết lại.
	 * Trả về HTML mới (chưa qua hvs_clean_html).
	 *
	 * @param string $html  Nội dung.
	 * @param string $alt   Alt mặc định (tiêu đề bài) khi ảnh không có alt.
	 */
	public function rewrite_content( $html, $alt = '' ) {
		if ( '' === (string) $html ) {
			return '';
		}
		$html = str_replace( 'https://cms.haivan.com//', 'https://cms.haivan.com/', (string) $html );
		$html = preg_replace_callback(
			'#<img\b[^>]*>#i',
			function ( $m ) use ( $alt ) {
				$tag = $m[0];
				$src = hvs_html_attr( $tag, 'src' );
				$n   = hvc_asset_url( $src, true );
				if ( ! $n ) {
					if ( preg_match( '#^(https?:)?//#i', trim( $src ) ) ) {
						++$this->stats['external'];
					}
					return $tag;
				}
				$id = $this->get( $n, hvs_html_attr( $tag, 'alt' ) ?: $alt );
				if ( ! $id ) {
					return $tag;
				}
				$local = wp_get_attachment_url( $id );
				if ( ! $local ) {
					return $tag;
				}
				$tag = preg_replace( '/\s(?:srcset|sizes)\s*=\s*(?:"[^"]*"|\'[^\']*\')/i', '', $tag );
				$tag = preg_replace_callback(
					'/(\ssrc\s*=\s*)(["\'])(.*?)\2/i',
					static function ( $mm ) use ( $local ) {
						return $mm[1] . '"' . esc_url( $local ) . '"';
					},
					$tag,
					1
				);
				return $tag;
			},
			$html
		);
		$html = preg_replace_callback(
			'#<a\b[^>]*>#i',
			function ( $m ) {
				$tag = $m[0];
				$n   = hvc_asset_url( hvs_html_attr( $tag, 'href' ), true );
				if ( ! $n || ( ! hvc_is_image_url( $n ) && ! hvc_is_doc_url( $n ) ) ) {
					return $tag;
				}
				$id = $this->get( $n, '', true );
				if ( ! $id ) {
					return $tag;
				}
				$local = wp_get_attachment_url( $id );
				if ( ! $local ) {
					return $tag;
				}
				return preg_replace_callback(
					'/(\shref\s*=\s*)(["\'])(.*?)\2/i',
					static function ( $mm ) use ( $local ) {
						return $mm[1] . '"' . esc_url( $local ) . '"';
					},
					$tag,
					1
				);
			},
			$html
		);
		return $html;
	}
}
