<?php
/**
 * Công cụ dùng chung cho wordpress/scripts/content-*.php (sửa nội dung bài hàng loạt, chạy được lại trên production).
 *
 * Quy ước của mọi script content-*.php:
 *  - Mặc định chỉ chạy thử (dry-run) và in bảng tóm tắt; ghi vào DB khi đặt HV_APPLY=1.
 *  - Idempotent: chạy lại sau khi đã ghi phải báo 0 thay đổi.
 *  - Ghi thẳng vào wp_posts bằng $wpdb->update: không đổi post_modified, không tạo bản sửa đổi, không chạy kses.
 *    Bài đã bị script ghi sẽ khác hv_imported_hash nên importer (import-cms.php) coi như "MKT đã sửa" và KHÔNG ghi đè
 *    lần nhập sau (đúng ý: các sửa lỗi này không bị nhập lại từ CMS cũ). Không đóng dấu lại.
 *  - Chỉ vá từng đoạn (regex/chuỗi), không thay cả bài, nên không mất phần MKT đã sửa.
 * Biến môi trường: HV_APPLY=1 ghi thật; HV_VERBOSE=1 in danh sách ID bài đổi; HV_SAMPLE=N số ví dụ trước/sau mỗi luật (mặc định 2); HV_IDS=1,2,3 chỉ chạy các bài này.
 * Sao lưu trước khi ghi: xem docs/wordpress.md ("Sửa nội dung hàng loạt").
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
if ( ! class_exists( 'Normalizer' ) ) {
	WP_CLI::error( 'Thiếu PHP intl (Normalizer): không chuẩn hoá được Unicode.' );
}

/** Kiểu bài chứa nội dung biên tập (không gồm tuyến/ưu đãi dựng từ meta). */
const HVC_CONTENT_TYPES = array( 'page', 'bai_viet', 'tin_tuc', 'diem_den', 'uu_dai' );

final class HVC_Run {
	/** @var string */
	public $name;
	/** @var bool */
	public $apply;
	/** @var int */
	public $sample_max;
	/** @var int[]|null */
	public $only_ids;
	/** @var int */
	public $scanned = 0;
	/** @var int[] bài có ít nhất một trường đổi */
	public $changed = array();
	/** @var array<string,array{n:int,ids:array<int,bool>}> */
	public $rules = array();
	/** @var array<string,string[]> */
	public $samples = array();
	/** @var string[] ghi chú cuối báo cáo */
	public $notes = array();

	public function __construct( $name ) {
		$this->name       = $name;
		$this->apply      = '1' === (string) ( getenv( 'HV_APPLY' ) ?: '0' );
		$this->sample_max = (int) ( getenv( 'HV_SAMPLE' ) !== false ? getenv( 'HV_SAMPLE' ) : 2 );
		$ids              = trim( (string) ( getenv( 'HV_IDS' ) ?: '' ) );
		$this->only_ids   = '' === $ids ? null : array_map( 'intval', explode( ',', $ids ) );
	}

	/**
	 * Bài cần quét.
	 *
	 * @param string[] $types    Kiểu bài.
	 * @param string[] $statuses Trạng thái.
	 * @return object[]
	 */
	public function posts( array $types = HVC_CONTENT_TYPES, array $statuses = array( 'publish', 'draft', 'pending', 'private' ) ) {
		global $wpdb;
		$t    = implode( ',', array_map( static fn( $x ) => $wpdb->prepare( '%s', $x ), $types ) );
		$s    = implode( ',', array_map( static fn( $x ) => $wpdb->prepare( '%s', $x ), $statuses ) );
		$rows = $wpdb->get_results( "SELECT ID, post_type, post_status, post_name, post_parent, post_title, post_content, post_excerpt FROM {$wpdb->posts} WHERE post_type IN ($t) AND post_status IN ($s) ORDER BY ID" ); // phpcs:ignore WordPress.DB.PreparedSQL
		if ( null !== $this->only_ids ) {
			$rows = array_values( array_filter( $rows, fn( $r ) => in_array( (int) $r->ID, $this->only_ids, true ) ) );
		}
		$this->scanned += count( $rows );
		return $rows;
	}

	/** Ghi nhận $n lần áp dụng luật $rule trên bài $id. */
	public function hit( $rule, $id, $n = 1 ) {
		if ( $n <= 0 ) {
			return;
		}
		$this->rules[ $rule ]['n']          = ( $this->rules[ $rule ]['n'] ?? 0 ) + $n;
		$this->rules[ $rule ]['ids'][ $id ] = true;
	}

	/** Lưu một ví dụ trước/sau (đoạn khác nhau đầu tiên ± ngữ cảnh, tính theo ký tự). */
	public function sample( $rule, $id, $before, $after ) {
		if ( count( $this->samples[ $rule ] ?? array() ) >= $this->sample_max || $before === $after ) {
			return;
		}
		$x = mb_str_split( $before );
		$y = mb_str_split( $after );
		$a = 0;
		$m = min( count( $x ), count( $y ) );
		while ( $a < $m && $x[ $a ] === $y[ $a ] ) {
			++$a;
		}
		$b = 0;
		while ( $b < $m - $a && $x[ count( $x ) - 1 - $b ] === $y[ count( $y ) - 1 - $b ] ) {
			++$b;
		}
		$ctx = static function ( array $c, $tail ) use ( $a ) {
			$from = max( 0, $a - 35 );
			$to   = min( count( $c ), count( $c ) - $tail + 35 );
			return trim( preg_replace( '/\s+/u', ' ', implode( '', array_slice( $c, $from, max( 0, min( $to - $from, 160 ) ) ) ) ) );
		};
		$this->samples[ $rule ][] = sprintf( '#%d: [%s]  =>  [%s]', $id, $ctx( $x, $b ), $ctx( $y, $b ) );
	}

	/**
	 * Ghi các trường đã đổi của một bài. $new chỉ cần chứa trường có thể đổi (post_title|post_content|post_excerpt).
	 *
	 * @return bool Có thay đổi.
	 */
	public function commit( $row, array $new ) {
		global $wpdb;
		$diff = array();
		foreach ( $new as $field => $value ) {
			if ( $value !== $row->$field ) {
				$diff[ $field ] = $value;
			}
		}
		if ( ! $diff ) {
			return false;
		}
		$this->changed[ (int) $row->ID ] = true;
		if ( $this->apply ) {
			$ok = $wpdb->update( $wpdb->posts, $diff, array( 'ID' => (int) $row->ID ) );
			if ( false === $ok ) {
				WP_CLI::error( sprintf( 'Ghi bài #%d lỗi: %s', $row->ID, $wpdb->last_error ) );
			}
			clean_post_cache( (int) $row->ID );
		}
		return true;
	}

	/** Đổi một meta (chuỗi). Trả true nếu có đổi. */
	public function commit_meta( $post_id, $key, $old, $new ) {
		if ( $old === $new ) {
			return false;
		}
		$this->changed[ (int) $post_id ] = true;
		if ( $this->apply ) {
			update_post_meta( $post_id, $key, wp_slash( $new ) );
		}
		return true;
	}

	/** In bảng tóm tắt và kết thúc. */
	public function finish() {
		ksort( $this->rules );
		WP_CLI::log( sprintf( '--- %s: %s ---', $this->name, $this->apply ? 'GHI THẬT (HV_APPLY=1)' : 'chạy thử (dry-run)' ) );
		foreach ( $this->rules as $rule => $r ) {
			WP_CLI::log( sprintf( '  %-34s %5d lần, %4d bài', $rule, $r['n'], count( $r['ids'] ) ) );
			foreach ( $this->samples[ $rule ] ?? array() as $s ) {
				WP_CLI::log( '      ' . $s );
			}
		}
		if ( '1' === (string) ( getenv( 'HV_VERBOSE' ) ?: '0' ) && $this->changed ) {
			WP_CLI::log( '  bài đổi: ' . implode( ',', array_keys( $this->changed ) ) );
		}
		foreach ( $this->notes as $n ) {
			WP_CLI::log( '  ghi chú: ' . $n );
		}
		WP_CLI::success(
			sprintf(
				'%s: quét %d, %d bài đổi%s.',
				$this->name,
				$this->scanned,
				count( $this->changed ),
				$this->apply ? ' (đã ghi)' : ' (chưa ghi; chạy lại với HV_APPLY=1)'
			)
		);
	}
}

/** Thay chuỗi cố định, ghi nhận luật. */
function hvc_replace( HVC_Run $run, $rule, $id, $from, $to, $s ) {
	if ( '' === $s || false === strpos( $s, $from ) ) {
		return $s;
	}
	$count = 0;
	$out   = str_replace( $from, $to, $s, $count );
	if ( $count ) {
		$run->hit( $rule, $id, $count );
		$run->sample( $rule, $id, $s, $out );
	}
	return $out;
}

/** Thay bằng regex (chuỗi hoặc callable), ghi nhận luật. */
function hvc_rx( HVC_Run $run, $rule, $id, $pattern, $replacement, $s ) {
	if ( '' === $s ) {
		return $s;
	}
	$count = 0;
	$out   = is_callable( $replacement )
		? preg_replace_callback( $pattern, $replacement, $s, -1, $count )
		: preg_replace( $pattern, $replacement, $s, -1, $count );
	if ( null === $out ) {
		WP_CLI::error( "Regex lỗi ở luật $rule (" . preg_last_error_msg() . ')' );
	}
	if ( $count && $out !== $s ) {
		$run->hit( $rule, $id, $count );
		$run->sample( $rule, $id, $s, $out );
		return $out;
	}
	return $s;
}

/**
 * Áp $fn lên từng đoạn văn bản NGOÀI thẻ HTML (bỏ qua nội dung <script>/<style>), giữ nguyên thẻ và thuộc tính.
 *
 * @param string   $html Chuỗi HTML.
 * @param callable $fn   function (string $text): string.
 */
function hvc_text_map( $html, callable $fn ) {
	$parts = preg_split( '/(<(?:script|style)\b[^>]*>.*?<\/(?:script|style)>|<!--.*?-->|<[^>]*>)/is', $html, -1, PREG_SPLIT_DELIM_CAPTURE );
	if ( false === $parts ) {
		return $html;
	}
	foreach ( $parts as $i => $p ) {
		if ( 0 === $i % 2 && '' !== $p ) {
			$parts[ $i ] = $fn( $p );
		}
	}
	return implode( '', $parts );
}

/** Chữ hiển thị của một đoạn HTML (bỏ thẻ, giải mã thực thể, gộp khoảng trắng). */
function hvc_visible( $html ) {
	return trim( preg_replace( '/\s+/u', ' ', html_entity_decode( wp_strip_all_tags( $html ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) );
}

/** Đường dẫn gốc của một bài (không host), ví dụ /diem-den/vung-tau/ten-bai. */
function hvc_post_path( $post_id ) {
	$url = get_permalink( $post_id );
	return $url ? (string) wp_parse_url( $url, PHP_URL_PATH ) : '';
}
