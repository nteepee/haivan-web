<?php
/**
 * wp eval-file /scripts/route-copy-v3-south.php
 * (từ thư mục wordpress: docker compose --profile tools run --rm -T wpcli eval-file /scripts/route-copy-v3-south.php)
 *
 * Ghi nội dung v3 cho 4 trang tuyến Vũng Tàu (dữ liệu: lib/route-copy-v3-south-data.php): title/meta mới theo brief SEO,
 * comment đã chốt trong brief, chính sách vé theo quyết định chủ sản phẩm, bố cục đầy đủ cho 2 trang sân bay.
 * Ghi ĐỦ mọi trường của meta box hv_route (theme inc/route-meta.php); trường dữ liệu không khai báo bị xoá trắng.
 * Ô HTML lọc bằng hv_route_clean_html như seed-route-landing.php; ô văn bản ghi nguyên văn (không qua sanitize_textarea_field vì hàm đó
 * xoá chuỗi %XX trong liên kết Google Maps). Kiểm tra dữ liệu trước khi ghi: đủ khoá, FAQ đúng dạng, ảnh và liên kết tuyến hợp lệ,
 * không còn câu chính sách cũ.
 * Idempotent: chỉ ghi trường khác giá trị hiện có; có thay đổi mới cập nhật ngày sửa bài (updated_at của REST).
 * Biến: HV_DRY_RUN=1 chỉ báo cáo; HV_ONLY=a/b chỉ xử lý một hướng.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
foreach ( array( 'hv_route_fields', 'hv_route_clean_html', 'hv_route_find', 'hv_route_cells', 'hv_route_lines', 'hv_route_image', 'hv_route_link_from' ) as $fn ) {
	if ( ! function_exists( $fn ) ) {
		WP_CLI::error( "Thiếu hàm {$fn}: theme haivan-web-child chưa được kích hoạt?" );
	}
}

$dry  = '1' === (string) ( getenv( 'HV_DRY_RUN' ) ?: '0' );
$only = (string) ( getenv( 'HV_ONLY' ) ?: '' );
$data = require __DIR__ . '/lib/route-copy-v3-south-data.php';

/** Câu chính sách cũ, lỗi chính tả và cam kết tuyệt đối không được xuất hiện lại. */
$banned = array(
	'cam kết hoàn tiền', 'dưới 6 tuổi', 'miễn phí hoàn toàn', 'chưa có chính sách', 'không được hoàn tiền', 'vẫn sẽ được hoàn',
	'ít nhất một tiếng', 'bồi hoàn', 'thuật tiện', 'Quận 1 Sân Bay', 'hầu hết các quận', 'khách bay sớm vẫn kịp', 'trước giờ lấy số',
	'Quyết định 2056', '21h00',
);

// Map khoá dữ liệu -> meta + loại trường, lấy từ meta box để không lệch hợp đồng.
$fields = array();
foreach ( hv_route_fields() as $meta => $f ) {
	$fields[ substr( $meta, strlen( 'hv_route_' ) ) ] = array( 'meta' => $meta, 'type' => $f[1] );
}

/** Giá trị sẽ ghi: ô HTML qua allowlist hợp đồng, ô khác nguyên văn đã trim. */
$clean = static fn( $type, $v ) => 'html' === $type ? hv_route_clean_html( $v ) : trim( $v );

/* Kiểm tra toàn bộ dữ liệu trước khi ghi bất kỳ bài nào. */
$errors = array();
foreach ( $data as $path => $d ) {
	foreach ( array_diff( array_keys( $d ), array_keys( $fields ) ) as $k ) {
		$errors[] = "{$path}: khoá lạ '{$k}' (không có trong meta box)";
	}
	foreach ( array_diff( array_keys( $fields ), array_keys( $d ) ) as $k ) {
		$errors[] = "{$path}: thiếu khoá '{$k}' (khai báo rỗng nếu cố ý bỏ trống)";
	}
	foreach ( $d as $k => $v ) {
		foreach ( $banned as $b ) {
			if ( false !== mb_stripos( (string) $v, $b ) ) {
				$errors[] = "{$path}.{$k}: còn cụm bị cấm \"{$b}\"";
			}
		}
	}
	foreach ( hv_route_lines( $d['faq'] ?? '' ) as $line ) {
		if ( 2 !== count( explode( '|', $line ) ) ) {
			$errors[] = "{$path}.faq: dòng phải đúng dạng \"câu hỏi | trả lời\": " . mb_substr( $line, 0, 60 );
		}
	}
	foreach ( array( 'reasons', 'offices', 'vehicle_classes' ) as $k ) {
		$img = array( 'reasons' => 2, 'offices' => 6, 'vehicle_classes' => 5 )[ $k ];
		foreach ( hv_route_lines( $d[ $k ] ?? '' ) as $line ) {
			$p = array_map( 'trim', explode( '|', $line ) );
			if ( isset( $p[ $img ] ) && '' !== $p[ $img ] && '' === hv_route_image( $p[ $img ] ) ) {
				$errors[] = "{$path}.{$k}: ảnh không hợp lệ \"{$p[ $img ]}\"";
			}
		}
	}
	foreach ( array_merge( hv_route_lines( $d['related'] ?? '' ), hv_route_lines( $d['reverse'] ?? '' ) ) as $line ) {
		if ( ! hv_route_link_from( $line ) ) {
			$errors[] = "{$path}: liên kết tuyến sai dạng \"nhãn | a/b\": {$line}";
		}
	}
	if ( mb_strlen( $d['seo_title'] ?? '' ) > 60 ) {
		WP_CLI::warning( "{$path}: title " . mb_strlen( $d['seo_title'] ) . ' ký tự (> 60)' );
	}
	if ( mb_strlen( $d['meta_description'] ?? '' ) > 160 ) {
		WP_CLI::warning( "{$path}: meta description " . mb_strlen( $d['meta_description'] ) . ' ký tự (> 160)' );
	}
}
if ( $errors ) {
	WP_CLI::error( "Dữ liệu không hợp lệ, chưa ghi gì:\n- " . implode( "\n- ", $errors ) );
}

$touched = 0;
foreach ( $data as $path => $d ) {
	if ( '' !== $only && $only !== $path ) {
		continue;
	}
	$post = hv_route_find( $path );
	if ( ! $post ) {
		WP_CLI::warning( "{$path}: chưa có bài hv_route xuất bản, bỏ qua (chạy seed-route-posts.php trước)" );
		continue;
	}
	$changed = array();
	foreach ( $fields as $k => $f ) {
		$new = $clean( $f['type'], (string) $d[ $k ] );
		if ( (string) get_post_meta( $post->ID, $f['meta'], true ) === $new ) {
			continue;
		}
		$changed[] = $k;
		if ( ! $dry && false === update_post_meta( $post->ID, $f['meta'], wp_slash( $new ) ) ) {
			WP_CLI::error( "{$path}: không ghi được {$f['meta']}" );
		}
	}
	if ( ! $changed ) {
		WP_CLI::log( "= {$path} (#{$post->ID}): đã đúng nội dung v3, không đổi" );
		continue;
	}
	WP_CLI::log( ( $dry ? '~ ' : '+ ' ) . "{$path} (#{$post->ID}): " . count( $changed ) . ' trường: ' . implode( ', ', $changed ) );
	if ( ! $dry ) {
		$res = wp_update_post( array( 'ID' => $post->ID ), true ); // cập nhật ngày sửa bài cho updated_at.
		if ( is_wp_error( $res ) ) {
			WP_CLI::error( "{$path}: " . $res->get_error_message() );
		}
		update_post_meta( $post->ID, 'hv_route_landing_seed', '1' ); // seed-route-landing.php không ghi đè.
	}
	++$touched;
}
WP_CLI::success( ( $dry ? '[dry-run] ' : '' ) . "nội dung v3 Vũng Tàu: {$touched} hướng " . ( $dry ? 'sẽ đổi' : 'đã cập nhật' ) . '.' );
