<?php
/**
 * wp eval-file /scripts/content-typos.php   (dry-run mặc định; HV_APPLY=1 để ghi)
 *
 * Chuẩn hoá và sửa lỗi chính tả trong nội dung biên tập (tiêu đề, nội dung, tóm tắt, meta Rank Math title/description):
 *  1. Unicode NFC (bài trộn NFD/NFC làm tìm kiếm và so khớp lệch).
 *  2. Xoá ký tự ẩn zero-width (U+200B/200C/200E/200F/2060/FEFF; U+200D chỉ khi cạnh chữ cái, để không hỏng emoji ghép).
 *     Tiêu đề từng dính ký tự ẩn được gộp khoảng trắng thừa và cắt đầu/cuối.
 *  3. Thực thể rò rỉ trong trường chữ thuần (tiêu đề, tóm tắt, meta SEO): "&quot;" và "&amp;quot;" thành dấu nháy kép;
 *     trong nội dung HTML chỉ sửa "&amp;quot;" (thoát đôi) thành "&quot;".
 *  4. Các lỗi chính tả nêu ở audit mục 9.1 (trừ mục 25 là popular-routes.json của Next) và hai lỗi đi kèm
 *     (nội dung bị đục chữ "trang web"/"ứng dụng" ở chính sách bảo mật).
 *  5. Lỗi dính chữ/viết thường tên riêng ở hai trang điểm đến Vũng Tàu và Hà Nội.
 * Idempotent. Xem lib/content-tools.php về cách ghi và sao lưu.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/content-tools.php';

$run = new HVC_Run( 'content-typos' );

/** Ký tự ẩn cần xoá. */
$zw_re = '/[\x{200B}\x{200C}\x{200E}\x{200F}\x{2060}\x{FEFF}]|(?<=[\p{L}\p{N}\p{Z}\p{P}])\x{200D}|\x{200D}(?=[\p{L}\p{N}\p{Z}\p{P}])/u';

/**
 * Lỗi chính tả: [luật, tìm, thay, phạm vi]. Phạm vi: null = mọi kiểu bài; mảng = các kiểu bài được áp dụng.
 * Chuỗi cố định, phân biệt hoa thường.
 */
$typos = array(
	array( 'typo-01-chu-tinh', 'Bắc Ninh đậm chất chữ tình', 'Bắc Ninh đậm chất trữ tình', null ),
	array( 'typo-02-mot', 'đẹp tựa như môt bức tranh', 'đẹp tựa như một bức tranh', null ),
	array( 'typo-03-voi-voi', ' với với ', ' với ', null ),
	array( 'typo-06-xes', 'trên xes,', 'trên xe,', null ),
	array( 'typo-07-hanh-ly', 'bổ sung hành ly.', 'bổ sung hành lý.', null ),
	array( 'typo-08-tui-qua', 'túi quần áo túi quà', 'túi quần áo, túi quà', null ),
	array( 'typo-09-ghe', 'Những được bôi ghi đậm', 'Những ghế được bôi ghi đậm', null ),
	array( 'typo-10-co-the', 'Bạn chỉ có chọn chỗ trước', 'Bạn chỉ có thể chọn chỗ trước', null ),
	array( 'typo-11-chuyen-di', 'trước những chuyến của mình', 'trước những chuyến đi của mình', null ),
	array( 'typo-12-nhung', 'không những cung cấp nhưng hạng xe', 'không những cung cấp những hạng xe', null ),
	array( 'typo-13-trung-tam', 'trung chăm sóc dịch vụ khách hàng', 'trung tâm chăm sóc dịch vụ khách hàng', null ),
	array( 'typo-14-doi-chuyen', 'chi phí đổi chuyển cho cả đoàn', 'chi phí đổi chuyến cho cả đoàn', null ),
	array( 'typo-15-noi-bo', 'Kế toán nội bổ', 'Kế toán nội bộ', null ),
	array( 'typo-16a-dau-phay', 'dừng nghỉ đúng chỗ,các anh', 'dừng nghỉ đúng chỗ, các anh', null ),
	array( 'typo-16b-viet-hoa', 'xe Điện Biên. nhân viên lịch sự', 'xe Điện Biên. Nhân viên lịch sự', null ),
	array( 'typo-17-bao-gom', 'là bào gồm nhưng không giới hạn', 'là bao gồm nhưng không giới hạn', null ),
	array( 'typo-18-su-dung', 'sử dụng dụng', 'sử dụng', null ),
	array( 'typo-19-url-dinh-chu', 'trên website http://Haivan.com<br>Nội dung', 'trên website https://haivan.com.<br>Nội dung', null ),
	array( 'typo-20-can-thiet', 'thông tin cẩn thiết', 'thông tin cần thiết', null ),
	array( 'typo-21-thong-tin', 'chúng tôi lưu trữ không tin cá nhân', 'chúng tôi lưu trữ thông tin cá nhân', null ),
	array( 'typo-22a-trang-web', 'HAY TRUY CẬP CỦA CHÚNG TÔI', 'HAY TRUY CẬP TRANG WEB CỦA CHÚNG TÔI', null ),
	array( 'typo-22b-trang-web', 'đăng những thay đổi đó trên của chúng tôi', 'đăng những thay đổi đó trên trang web của chúng tôi', null ),
	array( 'typo-22c-ung-dung', 'khi cài đặt và sử dụng của HAIVAN', 'khi cài đặt và sử dụng ứng dụng của HAIVAN', null ),
	array( 'typo-23a-hai-cham-phay', 'như là:, VNPay', 'như là: VNPay', null ),
	array( 'typo-23b-nha-nuoc', 'Ngân hàng nhà nước', 'Ngân hàng Nhà nước', null ),
	array( 'typo-24a-phat', 'được phat triển bởi', 'được phát triển bởi', null ),
	array( 'typo-24b-so-thu-tu', '<strong>4. Thẻ thanh toán quốc tế</strong>', '<strong>Thẻ thanh toán quốc tế</strong>', null ),
	// Hai trang điểm đến (Vũng Tàu, Hà Nội): dính chữ, tên riêng viết thường.
	array( 'typo-04-hub-dinh-chu', 'cho du khách.Du lịch', 'cho du khách. Du lịch', array( 'diem_den' ) ),
	array( 'typo-04-hub-dinh-chu', 'có gì mới,điều gì', 'có gì mới, điều gì', array( 'diem_den' ) ),
	array( 'typo-04-hub-dinh-chu', 'đợt này,bạn chắc', 'đợt này, bạn chắc', array( 'diem_den' ) ),
	array( 'typo-04-hub-ten-rieng', 'du lịch hà nội', 'du lịch Hà Nội', array( 'diem_den' ) ),
	array( 'typo-04-hub-ten-rieng', 'Du lịch hà nội', 'Du lịch Hà Nội', array( 'diem_den' ) ),
	array( 'typo-05-hub-ten-rieng', 'du lịch vũng tàu', 'du lịch Vũng Tàu', array( 'diem_den' ) ),
	array( 'typo-05-hub-ten-rieng', 'Du lịch vũng tàu', 'Du lịch Vũng Tàu', array( 'diem_den' ) ),
);

// Luật so khớp trên văn bản đã về NFC nên chính các chuỗi luật cũng phải là NFC.
foreach ( $typos as $i => $t ) {
	$typos[ $i ][1] = Normalizer::normalize( $t[1], Normalizer::FORM_C );
	$typos[ $i ][2] = Normalizer::normalize( $t[2], Normalizer::FORM_C );
}

/** Trường chữ thuần: thực thể rò rỉ được giải mã. */
$plain_fix = static function ( HVC_Run $run, $id, $s ) {
	$s = hvc_replace( $run, 'entity-amp-quot-plain', $id, '&amp;quot;', '"', $s );
	return hvc_replace( $run, 'entity-quot-plain', $id, '&quot;', '"', $s );
};

/** Chuẩn hoá một trường: NFC, ký tự ẩn, (tuỳ chọn) khoảng trắng tiêu đề. */
$normalize = static function ( HVC_Run $run, $id, $s, $is_title ) use ( $zw_re ) {
	if ( '' === $s ) {
		return $s;
	}
	if ( ! Normalizer::isNormalized( $s, Normalizer::FORM_C ) ) {
		$n = Normalizer::normalize( $s, Normalizer::FORM_C );
		if ( false !== $n && $n !== $s ) {
			$run->hit( 'nfc', $id );
			$run->sample( 'nfc', $id, $s, $n );
			$s = $n;
		}
	}
	$before = $s;
	$s      = hvc_rx( $run, 'zero-width', $id, $zw_re, '', $s );
	if ( $is_title && $s !== $before ) {
		$tidy = trim( preg_replace( '/[ \t]{2,}/u', ' ', $s ) );
		$s    = $tidy;
	}
	return $s;
};

foreach ( $run->posts() as $row ) {
	$id   = (int) $row->ID;
	$type = $row->post_type;

	$title   = $normalize( $run, $id, $row->post_title, true );
	$excerpt = $normalize( $run, $id, $row->post_excerpt, false );
	$content = $normalize( $run, $id, $row->post_content, false );

	$title   = $plain_fix( $run, $id, $title );
	$excerpt = $plain_fix( $run, $id, $excerpt );
	$content = hvc_replace( $run, 'entity-amp-quot-html', $id, '&amp;quot;', '&quot;', $content );

	foreach ( $typos as $t ) {
		if ( null !== $t[3] && ! in_array( $type, $t[3], true ) ) {
			continue;
		}
		$title   = hvc_replace( $run, $t[0], $id, $t[1], $t[2], $title );
		$content = hvc_replace( $run, $t[0], $id, $t[1], $t[2], $content );
		$excerpt = hvc_replace( $run, $t[0], $id, $t[1], $t[2], $excerpt );
	}

	$run->commit( $row, array( 'post_title' => $title, 'post_content' => $content, 'post_excerpt' => $excerpt ) );

	// Meta SEO của Rank Math (tiêu đề/mô tả hiển thị trên Google).
	foreach ( array( 'rank_math_title', 'rank_math_description' ) as $key ) {
		$old = get_post_meta( $id, $key, true );
		if ( ! is_string( $old ) || '' === $old ) {
			continue;
		}
		$new = $normalize( $run, $id, $old, 'rank_math_title' === $key );
		$new = $plain_fix( $run, $id, $new );
		foreach ( $typos as $t ) {
			if ( null === $t[3] || in_array( $type, $t[3], true ) ) {
				$new = hvc_replace( $run, $t[0], $id, $t[1], $t[2], $new );
			}
		}
		$run->commit_meta( $id, $key, $old, $new );
	}
}

$run->notes[] = 'Mục 25 (apps/booking/src/content/popular-routes.json: "thuật tiện", dính chữ sau dấu phẩy/chấm ở 3 tuyến Sơn La, Điện Biên, Bản Phủ) thuộc Next, không sửa ở đây.';
$run->finish();
