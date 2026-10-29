<?php
/**
 * wp eval-file /scripts/content-policy.php   (dry-run mặc định; HV_APPLY=1 để ghi)
 *
 * Quyết định của chủ doanh nghiệp về thanh toán và liên hệ:
 *  1. /ho-tro/huong-dan-thanh-toan (+ /en/): bỏ khối thông tin tài khoản ngân hàng (số tài khoản, tên tài khoản, ngân hàng, nội dung CK),
 *     thay bằng một câu: hệ thống tạo mã QR đúng số tiền ở bước thanh toán. Trang /en/ là bản sao nội dung tiếng Việt nên dùng cùng câu.
 *  2. /ho-tro/thanh-toan-viettel (+ /en/): đưa vào thùng rác, gỡ mục menu trỏ tới nó. 301 về trang hướng dẫn thanh toán nằm ở
 *     theme (inc/redirects.php); content-relink.php đổi mọi link nội bộ còn trỏ tới trang này.
 *  3. Mọi email liên hệ @haivan.com / @haivantravel.com trong tiêu đề, nội dung, tóm tắt (kể cả mailto:) thành info@haivan.com;
 *     câu liệt kê hai lần info@ liền nhau được gộp thành một. Email của bên thứ ba (bệnh viện...) giữ nguyên.
 * Idempotent. Xem lib/content-tools.php về cách ghi và sao lưu.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/content-tools.php';

$run = new HVC_Run( 'content-policy' );
global $wpdb;

const HVP_EMAIL = 'info@haivan.com';

/* ---------- 1. Khối chuyển khoản ---------- */
$bank_sentence = 'Chuyển khoản: hệ thống tạo mã QR đúng số tiền cần thanh toán ở bước thanh toán.';
$bank_re       = '#<p>\s*Đối với hình thức thanh toán bằng chuyển khoản[^<]*(?:<br\s*/?>\s*(?:Số tài khoản|Tên tài khoản|Ngân hàng|Nội dung CK)[^<]*)+(?:<br\s*/?>\s*)?</p>#u';

/* ---------- 3. Email ---------- */
$mail_re  = '/\b[A-Za-z0-9._+\-]+@(?:haivan\.com|haivantravel\.com)\b/iu';
$mail_one = preg_quote( HVP_EMAIL, '/' );

/** Thay mọi email nội bộ bằng info@ rồi gộp các lần lặp liền nhau. */
$mail_fix = static function ( HVC_Run $run, $id, $s ) use ( $mail_re, $mail_one ) {
	if ( '' === $s || false === stripos( $s, '@haivan' ) ) {
		return $s;
	}
	$s = hvc_rx(
		$run,
		'email-ve-info',
		$id,
		$mail_re,
		static fn( $m ) => strtolower( $m[0] ) === HVP_EMAIL ? $m[0] : HVP_EMAIL,
		$s
	);
	// Hai liên kết mailto liền nhau, cùng đích: giữ một.
	$link = '<a href="mailto:' . HVP_EMAIL . '[^"]*">(?:<[^>]+>)*' . $mail_one . '(?:<\/[^>]+>)*<\/a>';
	$sep  = '\s*(?:,|;|\/|-|–|và|hoặc|or|and)?\s*';
	$s    = hvc_rx( $run, 'email-trung-lap', $id, '/(' . $link . ')' . $sep . '\1/u', '$1', $s );
	// Chữ trơn lặp: "info@haivan.com và info@haivan.com".
	return hvc_rx( $run, 'email-trung-lap', $id, '/(?<![\w@.>])(' . $mail_one . ')' . $sep . '\1(?![\w.])/u', '$1', $s );
};

foreach ( $run->posts( array_merge( HVC_CONTENT_TYPES, array( 'hv_route', 'hv_offer' ) ) ) as $row ) {
	$id      = (int) $row->ID;
	$title   = $mail_fix( $run, $id, $row->post_title );
	$excerpt = $mail_fix( $run, $id, $row->post_excerpt );
	$content = $mail_fix( $run, $id, $row->post_content );

	if ( 'page' === $row->post_type && false !== strpos( $content, 'Đối với hình thức thanh toán bằng chuyển khoản' ) ) {
		$content = hvc_rx( $run, 'bo-khoi-tai-khoan-ngan-hang', $id, $bank_re, '<p>' . $bank_sentence . '</p>', $content );
	}
	$run->commit( $row, array( 'post_title' => $title, 'post_content' => $content, 'post_excerpt' => $excerpt ) );
}

/* ---------- 2. Trang Viettel: thùng rác + menu ---------- */
$viettel = array();
foreach ( $wpdb->get_results( "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'page' AND post_status IN ('publish','draft','pending','private') AND post_name = 'thanh-toan-viettel'" ) as $p ) { // phpcs:ignore WordPress.DB.PreparedSQL
	if ( '/ho-tro/thanh-toan-viettel' === preg_replace( '#^/en#', '', rtrim( hvc_post_path( (int) $p->ID ), '/' ) ) ) {
		$viettel[] = (int) $p->ID;
	}
}
foreach ( $viettel as $pid ) {
	$run->hit( 'trang-viettel-thung-rac', $pid );
	$run->changed[ $pid ] = true;
	if ( $run->apply ) {
		wp_trash_post( $pid );
	}
}
// Mục menu trỏ tới trang (custom link hoặc mục trang), kể cả bản /en/.
$items = $wpdb->get_col( "SELECT p.ID FROM {$wpdb->posts} p JOIN {$wpdb->postmeta} m ON m.post_id = p.ID WHERE p.post_type = 'nav_menu_item' AND p.post_status = 'publish' AND ( ( m.meta_key = '_menu_item_url' AND m.meta_value LIKE '%/ho-tro/thanh-toan-viettel%' ) OR ( m.meta_key = '_menu_item_object_id' AND m.meta_value IN (" . ( $viettel ? implode( ',', array_map( 'intval', $viettel ) ) : '0' ) . ') ) )' ); // phpcs:ignore WordPress.DB.PreparedSQL
foreach ( $items as $item_id ) {
	$run->hit( 'menu-viettel-go', (int) $item_id );
	if ( $run->apply ) {
		wp_delete_post( (int) $item_id, true );
	}
}
if ( ! $viettel && ! $items ) {
	$run->notes[] = 'Trang thanh-toan-viettel đã không còn (đã trong thùng rác hoặc chưa từng có).';
}
$run->notes[] = 'Tài khoản cá nhân (Võ Thị Mỹ Hải) chỉ có ở trang Viettel: biến mất theo trang. 301 và link nội bộ: inc/redirects.php + content-relink.php.';

$run->finish();
