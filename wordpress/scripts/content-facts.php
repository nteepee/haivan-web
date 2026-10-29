<?php
/**
 * wp eval-file /scripts/content-facts.php   (dry-run mặc định; HV_APPLY=1 để ghi; HV_REPORT=1 in thêm danh sách cần người quyết)
 *
 * Phần không mơ hồ của việc thống nhất thông tin thương hiệu:
 *  - Hotline Hải Vân là 1900 6763: sửa số sai 19006773 (chữ và liên kết tel:), và viết mọi biến thể
 *    (19006763, 1900-6763, 1900.6763, NBSP) thành "1900 6763" trong chữ hiển thị. Liên kết tel: dùng 19006763 (không dấu cách).
 *    Các số 1900 khác (bệnh viện, bưu điện, hãng khác) không đụng tới.
 *  - "Công ty Công ty LDVCQT" thành "Công ty LDVCQT".
 *  - Mốc thành lập: trang/bài đã ghi "năm 1994" mà còn viết "hơn 25 năm" thì thành "hơn 30 năm" (chỉ page và bai_viet;
 *    tin_tuc là tin có ngày, "hơn 25 năm" đúng thời điểm đăng).
 *  - Tuyến Lào Cai - Sapa đã ngưng (chủ doanh nghiệp xác nhận): "với 70% thị phần tuyến Lào Cai – Sapa" thành "từng chiếm khoảng 70% ...".
 *  - Hai trang điểm đến Vũng Tàu và Hà Nội: bỏ "năm 2021" khỏi câu mở đầu "Du lịch ... năm 2021 có gì mới".
 * Trụ sở cũ "Lô C8 Nguyễn Chánh, Phường Trung Hòa, Quận Cầu Giấy, (TP.) Hà Nội" thành địa chỉ ở chân trang (chủ doanh nghiệp chốt):
 *   "Tầng 5, Toà nhà 125 Hoàng Ngân, Phường Yên Hòa, Hà Nội". Nội dung biên tập không có địa chỉ/giấy chứng nhận ĐKKD (chỉ có ở chân trang, thuộc theme).
 * KHÔNG đổi: email, tài khoản nhận tiền/người nhận (chủ doanh nghiệp xác nhận). Số 1900 9398 (tổng đài khác) giữ nguyên. HV_REPORT=1 liệt kê chúng.
 * Idempotent.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/content-tools.php';

$run    = new HVC_Run( 'content-facts' );
$report = '1' === (string) ( getenv( 'HV_REPORT' ) ?: '0' );

/** Số hotline Hải Vân (sai hoặc đúng) ở mọi cách viết: 1900 6763 hoặc 1900 6773, ngăn cách bằng cách trắng, NBSP, dấu chấm, gạch. */
$hotline_re = '/(?<![\d.])1900[ \x{00A0}.\-]?67[67]3(?!\d)/u';

/** Chữ thuần (tiêu đề, tóm tắt, đoạn văn bản ngoài thẻ). */
$text_fix = static function ( HVC_Run $run, $id, $s ) use ( $hotline_re ) {
	$s = hvc_rx( $run, 'hotline-chuan-hoa', $id, $hotline_re, '1900 6763', $s );
	$s = hvc_replace( $run, 'cong-ty-lap-chu', $id, 'Công ty Công ty', 'Công ty', $s );
	// Trụ sở/liên hệ: chủ doanh nghiệp chốt theo chân trang (Tầng 5, Toà nhà 125 Hoàng Ngân, Phường Yên Hòa, Hà Nội).
	return hvc_rx( $run, 'tru-so-125-hoang-ngan', $id, '/Lô C8 Nguyễn Chánh, Phường Trung Hòa, Quận Cầu Giấy,(?: TP\.)? Hà Nội/u', 'Tầng 5, Toà nhà 125 Hoàng Ngân, Phường Yên Hòa, Hà Nội', $s );
};

foreach ( $run->posts() as $row ) {
	$id   = (int) $row->ID;
	$type = $row->post_type;

	$title   = $text_fix( $run, $id, $row->post_title );
	$excerpt = $text_fix( $run, $id, $row->post_excerpt );

	$content = $row->post_content;
	// Liên kết tel: của hotline (kể cả số sai) thống nhất về 19006763.
	$content = hvc_rx(
		$run,
		'hotline-tel-href',
		$id,
		'/href=(["\'])tel:\s*1900[ \x{00A0}.\-]?67[67]3\1/u',
		'href=$1tel:19006763$1',
		$content
	);
	$content = hvc_text_map( $content, static fn( $t ) => $text_fix( $run, $id, $t ) );

	if ( in_array( $type, array( 'page', 'bai_viet' ), true ) && false !== strpos( $content, '1994' ) ) {
		$content = hvc_replace( $run, 'moc-30-nam', $id, 'hơn 25 năm', 'hơn 30 năm', $content );
	}
	// Hải Vân từng chạy Lào Cai - Sapa, nay đã ngưng: câu thị phần chuyển sang quá khứ.
	$content = hvc_rx( $run, 'lao-cai-sapa-qua-khu', $id, '/\bvới 70% thị phần tuyến Lào Cai – Sapa/u', 'từng chiếm khoảng 70% thị phần tuyến Lào Cai – Sapa', $content );
	if ( 'diem_den' === $type ) {
		$year = '/(Du lịch (?:Vũng Tàu|Hà Nội|vũng tàu|hà nội)) năm 2021 (có gì mới)/u';
		$content = hvc_rx( $run, 'bo-nam-2021-hub', $id, $year, '$1 $2', $content );
		$excerpt = hvc_rx( $run, 'bo-nam-2021-hub', $id, $year, '$1 $2', $excerpt );
	}

	$run->commit( $row, array( 'post_title' => $title, 'post_content' => $content, 'post_excerpt' => $excerpt ) );
}

if ( $report ) {
	/**
	 * Liệt kê (chỉ đọc) những chỗ cần chủ doanh nghiệp/MKT quyết.
	 *
	 * @param string   $label Nhãn.
	 * @param string   $re    Regex trên chữ hiển thị.
	 * @param string[] $types Kiểu bài.
	 */
	$list = static function ( $label, $re, array $types ) use ( $run ) {
		global $wpdb;
		$t    = implode( ',', array_map( static fn( $x ) => $wpdb->prepare( '%s', $x ), $types ) );
		$rows = $wpdb->get_results( "SELECT ID, post_type, post_content FROM {$wpdb->posts} WHERE post_status IN ('publish','draft') AND post_type IN ($t) ORDER BY ID" ); // phpcs:ignore WordPress.DB.PreparedSQL
		$out  = array();
		foreach ( $rows as $r ) {
			$txt = hvc_visible( $r->post_content );
			if ( preg_match_all( $re, $txt, $m ) ) {
				$out[] = '#' . $r->ID . '(' . $r->post_type . ')x' . count( $m[0] );
			}
		}
		$run->notes[] = sprintf( '[%s] %d bài: %s', $label, count( $out ), implode( ' ', array_slice( $out, 0, 60 ) ) );
	};
	$list( 'còn "25 năm" (không cùng trang với 1994)', '/\b25 năm\b/u', array( 'page', 'bai_viet', 'tin_tuc' ) );
	$list( '70% thị phần Lào Cai - Sapa (tuyến đã ngưng)', '/70\s*%\s*thị phần/u', array( 'page', 'tin_tuc', 'bai_viet' ) );
	$list( 'nhắc Lào Cai/Sapa kèm "hiện/đang" (có thể đọc như còn khai thác)', '/(?:hiện(?: nay)?|đang)[^.]{0,80}(?:Lào Cai|Sa ?pa|Sa Pa)|(?:Lào Cai|Sa ?pa|Sa Pa)[^.]{0,80}(?:hiện(?: nay)?|đang (?:khai thác|chạy|phục vụ|vận hành))/iu', array( 'page', 'diem_den', 'tin_tuc' ) );
	$list( 'còn "năm 2021"', '/năm 2021\b/u', array( 'page', 'diem_den', 'bai_viet' ) );
	$list( 'thì tương lai về mốc đã qua (sẽ ... 2020/2022)', '/sẽ [^.]{0,120}(?:năm 2020|năm 2022|tháng 6 năm 2020)/u', array( 'page', 'bai_viet' ) );
	$list( 'email liên hệ (cần thống nhất)', '/[\w.\-]+@(?:haivan\.com|haivantravel\.com)/u', array( 'page', 'diem_den', 'bai_viet', 'tin_tuc' ) );
	$list( 'còn trụ sở cũ Lô C8 Nguyễn Chánh', '/Lô C8 Nguyễn Chánh/u', array( 'page' ) );
	$list( 'số 1900 9398 (giữ nguyên, tổng đài khác)', '/1900[ .\-]?9398/u', array( 'page', 'tin_tuc', 'bai_viet' ) );
	$list( 'tài khoản nhận tiền / người nhận (cần xác nhận)', '/(?:Tên tài khoản|Người nhận|Số tài khoản)/u', array( 'page' ) );
}

$run->finish();
