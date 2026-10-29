<?php
/**
 * wp eval-file /scripts/seo-setup.php
 * Rank Math: đồ thị tri thức = Tổ chức (Organization) "Hải Vân" có logo, điện thoại, Facebook (thay Person).
 * Idempotent: chạy lại không tạo thêm logo, không ghi đè giá trị MKT đã đổi (chỉ đặt khi đang là "person" hoặc trống).
 * Không đụng blog_public (quy tắc theo WP_ENV_TYPE ở configure-site.php) và title/description từng bài (giữ meta đã nhập).
 * Biến: HV_LOGO_SOURCE (mặc định /cms-cache/logo-yellow.jpg, tệp cục bộ trong thư mục mount của wpcli), HV_DRY_RUN=1.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/helpers.php';

$dry  = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$opts = get_option( 'rank-math-options-titles', array() );
$opts = is_array( $opts ) ? $opts : array();
$set  = hv_layout_settings();

$changed = array();
if ( ! in_array( $opts['knowledgegraph_type'] ?? '', array( 'company' ), true ) ) {
	$opts['knowledgegraph_type'] = 'company';
	$changed[]                   = 'knowledgegraph_type=company';
}
if ( '' === trim( (string) ( $opts['knowledgegraph_name'] ?? '' ) ) ) {
	$opts['knowledgegraph_name'] = 'Hải Vân';
	$changed[]                   = 'knowledgegraph_name';
}
if ( empty( $opts['knowledgegraph_logo_id'] ) ) {
	$src   = getenv( 'HV_LOGO_SOURCE' ) ?: '/cms-cache/logo-yellow.jpg';
	$logo  = $dry ? 0 : hvs_sideload( $src, 0, 'Logo Hải Vân' );
	if ( $logo ) {
		$opts['knowledgegraph_logo_id'] = $logo;
		$opts['knowledgegraph_logo']    = wp_get_attachment_url( $logo );
		$changed[]                      = 'knowledgegraph_logo';
	} elseif ( ! $dry ) {
		WP_CLI::warning( "Không tải được logo từ {$src} (copy apps/booking/public/assets/images/logo-yellow.jpg vào wordpress/data/cms-cache/ rồi chạy lại)." );
	}
}
if ( empty( $opts['phone_numbers'] ) ) {
	$digits = preg_replace( '/\D/', '', (string) $set['hotline'] );
	if ( '' !== $digits ) {
		$opts['phone_numbers'] = array( array( 'type' => 'customer support', 'number' => '+84 ' . substr( $digits, 0, 4 ) . ' ' . substr( $digits, 4 ) ) );
		$changed[]             = 'phone_numbers';
	}
}
if ( empty( $opts['social_url_facebook'] ) && '' !== (string) $set['social_facebook'] ) {
	$opts['social_url_facebook'] = $set['social_facebook'];
	$changed[]                   = 'social_url_facebook';
}
// Trang chủ: title/description khi MKT chưa nhập (title gốc của web cũ theo phase 11; mô tả theo comp trang chủ đã duyệt).
$front = (int) get_option( 'page_on_front' );
if ( $front > 0 && '' === (string) get_post_meta( $front, 'rank_math_title', true ) && '' === (string) get_post_meta( $front, 'rank_math_description', true ) ) {
	$changed[] = 'trang chủ: title + description';
	if ( ! $dry ) {
		update_post_meta( $front, 'rank_math_title', 'Hãng xe Hải Vân - xe liên tỉnh, xe hợp đồng, xe sân bay' );
		update_post_meta( $front, 'rank_math_description', 'Đặt vé xe khách Hải Vân đi Tây Bắc, Vũng Tàu, sân bay Tân Sơn Nhất. Tự chọn giường hoặc ghế, giữ vé trên điện thoại. Hotline 1900 6763.' );
	}
}
WP_CLI::log( $changed ? 'Đặt: ' . implode( ', ', $changed ) : 'Rank Math đã đúng, không đổi.' );
if ( $changed && ! $dry ) {
	update_option( 'rank-math-options-titles', $opts );
}
WP_CLI::success( ( $dry ? '[dry-run] ' : '' ) . 'xong.' );
