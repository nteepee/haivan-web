<?php
/**
 * Dữ liệu và hàm dùng chung của content-relink.php và content-bridge.php:
 * bản đồ link nội bộ (lib/relink-map.csv, trích từ haivan-jev-100-percent-link-map.csv của audit), tuyến đặt vé đang sống,
 * phân nhóm bài ngưng chạy/bệnh viện.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/content-tools.php';

/** Bốn landing tuyến chính do gói corridor dựng; coi là sống ngay cả khi CPT hv_corridor chưa có. */
const HVL_CORRIDOR_LANDINGS = array(
	'my-dinh/moc-chau',
	'moc-chau/my-dinh',
	'son-la/my-dinh',
	'dien-bien/my-dinh',
);

/** Nhóm điểm đến đã ngưng khai thác. */
const HVL_NORTH = array( 'ha-giang', 'sa-pa', 'lao-cai', 'tuyen-quang', 'ha-long', 'ninh-binh' );
const HVL_SOUTH = array( 'hue', 'da-lat', 'nha-trang', 'da-nang', 'hoi-an' );

/**
 * Bản đồ link: đường dẫn bài (chữ thường) => dòng CSV.
 *
 * @return array<string,array<string,string>>
 */
function hvl_csv() {
	static $map = null;
	if ( null !== $map ) {
		return $map;
	}
	$file = (string) ( getenv( 'HV_RELINK_CSV' ) ?: __DIR__ . '/relink-map.csv' );
	$fh   = fopen( $file, 'r' );
	if ( ! $fh ) {
		WP_CLI::error( "Không đọc được bản đồ link: $file" );
	}
	$head = fgetcsv( $fh, 0, ',', '"', '' );
	$map  = array();
	while ( false !== ( $r = fgetcsv( $fh, 0, ',', '"', '' ) ) ) {
		if ( count( $r ) !== count( $head ) ) {
			continue;
		}
		$row                               = array_combine( $head, $r );
		$map[ strtolower( $row['article_url'] ) ] = $row;
	}
	fclose( $fh );
	return $map;
}

/**
 * Tuyến đặt vé sống (đường dẫn không có /xe-khach/ đầu): hv_route + landing của hv_corridor + 4 landing cố định.
 *
 * @return array<string,true>
 */
function hvl_live_routes() {
	static $live = null;
	if ( null !== $live ) {
		return $live;
	}
	global $wpdb;
	$live = array();
	foreach ( HVL_CORRIDOR_LANDINGS as $p ) {
		$live[ $p ] = true;
	}
	$keys = "'hv_route_path','hv_corridor_landing_ab','hv_corridor_landing_ba'";
	foreach ( $wpdb->get_col( "SELECT DISTINCT pm.meta_value FROM {$wpdb->postmeta} pm JOIN {$wpdb->posts} p ON p.ID = pm.post_id WHERE pm.meta_key IN ($keys) AND p.post_status = 'publish'" ) as $v ) { // phpcs:ignore WordPress.DB.PreparedSQL
		$v = trim( (string) $v, "/ \t" );
		if ( '' !== $v ) {
			$live[ $v ] = true;
		}
	}
	return $live;
}

/** Tuyến $path (dạng /xe-khach/a/b) có sống không? */
function hvl_route_live( $path ) {
	return isset( hvl_live_routes()[ trim( preg_replace( '#^/xe-khach/#', '', $path ), '/' ) ] );
}

/** Cụm của bài: CSV nếu có, không thì đoạn thứ 2 của /diem-den/<điểm>/..., tin công ty là "tin_tuc". */
function hvl_cluster( $row, $csv ) {
	if ( $csv ) {
		return $csv['cluster'];
	}
	if ( 'tin_tuc' === $row->post_type ) {
		return 'tin_tuc';
	}
	$parts = explode( '/', trim( hvc_post_path( (int) $row->ID ), '/' ) );
	return $parts[1] ?? '';
}

/**
 * Loại khối bắc cầu cần cho bài: 'north' (mẫu 1), 'south' (mẫu 2), 'hospital' (mẫu 3) hoặc '' (không cần).
 * Mẫu 3: bài bệnh viện/y tế trong cụm /diem-den/ha-noi.
 */
function hvl_bridge_type( $row, $csv ) {
	if ( ! in_array( $row->post_type, array( 'bai_viet', 'tin_tuc' ), true ) ) {
		return '';
	}
	$cluster = hvl_cluster( $row, $csv );
	if ( 'tin_tuc' === $row->post_type && ! $csv ) {
		return ''; // tin công ty chỉ phân nhóm khi có trong bản đồ link
	}
	if ( in_array( $cluster, HVL_NORTH, true ) ) {
		return 'north';
	}
	if ( in_array( $cluster, HVL_SOUTH, true ) ) {
		return 'south';
	}
	if ( 'ha-noi' === $cluster ) {
		$medical = $csv ? 'hospital_medical' === $csv['topic'] : (bool) preg_match( '/bệnh viện|phòng khám|khám bệnh|y tế/iu', $row->post_title );
		return $medical ? 'hospital' : '';
	}
	return '';
}

/** Thẻ liên kết tuyến: <a href="..."><strong>văn bản</strong></a>. */
function hvl_a( $href, $text ) {
	return '<a href="' . esc_attr( $href ) . '"><strong>' . esc_html( $text ) . '</strong></a>';
}

/** Nhãn mô tả cho đích liên kết (dùng thay anchor "tại đây"). */
function hvl_labels() {
	return array(
		'/xe-khach/quan-1/vung-tau'         => 'xe đi Vũng Tàu từ Quận 1 Sài Gòn',
		'/xe-khach/vung-tau/quan-1-san-bay' => 'xe Vũng Tàu đi Sài Gòn',
		'/xe-khach/tan-son-nhat/vung-tau'   => 'xe Sân bay Tân Sơn Nhất đi Vũng Tàu',
		'/xe-khach/vung-tau/tan-son-nhat'   => 'xe Vũng Tàu đi Sân bay Tân Sơn Nhất',
		'/xe-khach/my-dinh/son-la'          => 'xe Hà Nội đi Sơn La từ Bến xe Mỹ Đình',
		'/xe-khach/son-la/my-dinh'          => 'xe Sơn La về Hà Nội (Bến xe Mỹ Đình)',
		'/xe-khach/my-dinh/dien-bien'       => 'xe Hà Nội đi Điện Biên từ Bến xe Mỹ Đình',
		'/xe-khach/yen-nghia/dien-bien'     => 'xe Yên Nghĩa đi Điện Biên',
		'/xe-khach/dien-bien/my-dinh'       => 'xe Điện Biên về Hà Nội (Bến xe Mỹ Đình)',
		'/xe-khach/my-dinh/moc-chau'        => 'xe Hà Nội đi Mộc Châu từ Bến xe Mỹ Đình',
		'/xe-khach/moc-chau/my-dinh'        => 'xe Mộc Châu về Hà Nội (Bến xe Mỹ Đình)',
		'/xe-khach'                         => 'trang đặt vé xe khách Hải Vân',
		'/'                                 => 'trang chủ Hãng xe Hải Vân',
	);
}

/** Bỏ emoji, ký hiệu hình và mũi tên khỏi chữ chèn vào khối liên kết (design v4 không dùng emoji); mũi tên thành gạch ngang. */
function hvl_plain( $text ) {
	$text = preg_replace( '/\s*[\x{2190}-\x{21FF}]\s*/u', ' – ', $text );
	$text = preg_replace( '/[\x{1F000}-\x{1FFFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE0F}\x{200D}]/u', '', $text );
	return trim( preg_replace( '/\s{2,}/u', ' ', $text ) );
}

/** Từ khoá của tiêu đề (không dấu, chữ thường, bỏ từ phổ biến) để so độ gần nhau giữa các bài. */
function hvl_tokens( $title ) {
	static $stop = array( 'va', 'la', 'cua', 'cho', 'cac', 'nhung', 'mot', 'nhat', 'the', 'nao', 'co', 'gi', 'tai', 'di', 'den', 'voi', 'tu', 'trong', 'duoc', 'khi', 'ban', 'can', 'biet', 'hien', 'nay', 'moi', 'tot', 'uy', 'tin', 'chi', 'tiet', 'tong', 'hop', 'cap', 'nhat', 'review', 'kinh', 'nghiem', 'huong', 'dan', 'thong', 'top' );
	$t = strtolower( remove_accents( html_entity_decode( wp_strip_all_tags( $title ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) );
	$w = preg_split( '/[^a-z0-9]+/', $t, -1, PREG_SPLIT_NO_EMPTY );
	return array_values( array_unique( array_filter( $w, static fn( $x ) => strlen( $x ) > 1 && ! in_array( $x, $stop, true ) ) ) );
}
