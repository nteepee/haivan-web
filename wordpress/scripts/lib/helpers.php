<?php
/**
 * Hàm dùng chung cho seed-site.php và import-old-site.php (chạy trong WP-CLI).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/sanitize.php';

/**
 * Lần cài đặt đầu? Các tuỳ chọn MKT có thể đã chỉnh (tên site, module Rank Math, trang chủ, menu...) chỉ được
 * đặt ở lần đầu. Đã cấu hình = có option hv_site_configured (đặt cuối seed-site.php) HOẶC đã có trang chủ tĩnh
 * (site dựng trước khi có dấu). Ép cấu hình lại: HV_RECONFIGURE=1.
 */
function hvs_is_first_run() {
	if ( '1' === (string) ( getenv( 'HV_RECONFIGURE' ) ?: '0' ) ) {
		return true;
	}
	return ! get_option( 'hv_site_configured' ) && ! (int) get_option( 'page_on_front' );
}

/**
 * Quy tắc blog_public: chỉ noindex khi WP_ENVIRONMENT_TYPE được đặt RÕ là local/development/staging.
 * Thiếu biến hoặc giá trị lạ = production (cho phép lập chỉ mục) để một lần quên cấu hình không làm site mất SEO.
 */
function hvs_env_is_non_production() {
	return in_array( wp_get_environment_type(), array( 'local', 'development', 'staging' ), true );
}

/** Mã ngôn ngữ Polylang hợp lệ cho bài. */
function hvs_has_polylang() {
	return function_exists( 'pll_set_post_language' ) && function_exists( 'PLL' ) && PLL()->model->has_languages();
}

/**
 * Tìm trang theo đường dẫn ("chung-toi/gioi-thieu") và ngôn ngữ.
 *
 * @return int ID hoặc 0.
 */
function hvs_find_page( $path, $lang = 'vi' ) {
	$path = trim( $path, '/' );
	$args = array(
		'post_type'        => 'page',
		'name'             => basename( $path ),
		'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future', 'trash' ), // trash: tìm thấy để không tạo lại bản đã bị MKT xoá.
		'numberposts'      => 50,
		'fields'           => 'ids',
		'suppress_filters' => true,
	);
	$ids = get_posts( $args );
	if ( hvs_has_polylang() ) {
		$ids = hv_ids_in_lang( $ids, $lang );
	}
	foreach ( $ids as $id ) {
		if ( trim( (string) get_page_uri( $id ), '/' ) === $path ) {
			return (int) $id;
		}
	}
	return 0;
}

/**
 * Tạo (hoặc lấy) trang theo đường dẫn + ngôn ngữ; cha phải tồn tại trước.
 *
 * @param string      $path     Đường dẫn đầy đủ.
 * @param string      $title    Tiêu đề.
 * @param string      $lang     'vi'|'en'.
 * @param string      $status   publish|draft.
 * @param string|null $template Mẫu trang (relative) hoặc null.
 * @return int ID trang.
 */
function hvs_ensure_page( $path, $title, $lang, $status = 'publish', $template = null ) {
	$path = trim( $path, '/' );
	$id   = hvs_find_page( $path, $lang );
	if ( $id ) {
		return $id;
	}
	$parts  = explode( '/', $path );
	$slug   = array_pop( $parts );
	$parent = $parts ? hvs_find_page( implode( '/', $parts ), $lang ) : 0;
	if ( $parts && ! $parent ) {
		WP_CLI::warning( "Thiếu trang cha cho $path ($lang)" );
	}
	$id = wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_status'  => $status,
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_parent'  => $parent,
			'post_content' => '',
			'post_author'  => 1,
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( "Không tạo được $path ($lang): " . $id->get_error_message() );
		return 0;
	}
	if ( hvs_has_polylang() ) {
		pll_set_post_language( $id, $lang );
		// Ép slug đúng sau khi đã gán ngôn ngữ (filter wp_unique_post_slug cho phép trùng slug khác ngôn ngữ).
		if ( get_post_field( 'post_name', $id ) !== $slug ) {
			wp_update_post( array( 'ID' => $id, 'post_name' => $slug ) );
		}
	}
	if ( $template ) {
		update_post_meta( $id, '_wp_page_template', $template );
	}
	return (int) $id;
}

/** Liên kết bản dịch vi <-> en. */
function hvs_link_translations( $vi_id, $en_id ) {
	if ( ! hvs_has_polylang() || ! $vi_id || ! $en_id ) {
		return;
	}
	pll_save_post_translations( array( 'vi' => (int) $vi_id, 'en' => (int) $en_id ) );
}

/**
 * Đưa file/URL vào Media. Trả về attachment ID hoặc 0. Không ném lỗi (nhập liệu chịu được thiếu ảnh).
 *
 * @param string $source Đường dẫn file cục bộ hoặc URL http(s).
 * @param int    $post_id Bài gắn vào.
 * @param string $desc    Mô tả/alt.
 */
function hvs_sideload( $source, $post_id = 0, $desc = '' ) {
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	// Đã nhập trước đó (theo nguồn) → dùng lại, chạy lại script không nhân bản ảnh.
	$existing = get_posts(
		array(
			'post_type'        => 'attachment',
			'post_status'      => 'inherit',
			'meta_key'         => 'hv_import_source', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'       => $source, // phpcs:ignore WordPress.DB.SlowDBQuery
			'numberposts'      => 1,
			'fields'           => 'ids',
			'suppress_filters' => true,
		)
	);
	if ( $existing ) {
		return (int) $existing[0];
	}

	$tmp = '';
	if ( preg_match( '#^https?://#i', $source ) ) {
		// Chỉ GET (đọc) từ máy chủ nội dung Hải Vân.
		$host = (string) wp_parse_url( $source, PHP_URL_HOST );
		if ( ! in_array( $host, array( 'cms.haivan.com', 'haivan.com' ), true ) ) {
			return 0;
		}
		$tmp = download_url( $source, 30 );
		if ( is_wp_error( $tmp ) ) {
			return 0;
		}
	} elseif ( is_file( $source ) ) {
		$tmp = wp_tempnam( basename( $source ) );
		if ( ! $tmp || ! copy( $source, $tmp ) ) {
			return 0;
		}
	} else {
		return 0;
	}

	$name = sanitize_file_name( rawurldecode( basename( (string) wp_parse_url( $source, PHP_URL_PATH ) ) ) );
	if ( '' === $name || ! preg_match( '/\.(jpe?g|png|gif|webp|svg)$/i', $name ) ) {
		wp_delete_file( $tmp );
		return 0;
	}
	$id = media_handle_sideload( array( 'name' => $name, 'tmp_name' => $tmp ), $post_id, $desc );
	if ( is_wp_error( $id ) ) {
		wp_delete_file( $tmp );
		return 0;
	}
	update_post_meta( $id, 'hv_import_source', $source );
	if ( '' !== $desc ) {
		update_post_meta( $id, '_wp_attachment_image_alt', $desc );
	}
	return (int) $id;
}

/**
 * Hash trạng thái nội dung của một bài (tiêu đề, nội dung, tóm tắt, thứ tự). Dùng để biết MKT đã sửa chưa.
 *
 * @param int|WP_Post $post Bài.
 */
function hvs_state_hash( $post ) {
	$post = get_post( $post );
	if ( ! $post ) {
		return '';
	}
	return md5( implode( "\0", array( $post->post_title, $post->post_content, $post->post_excerpt, (string) (int) $post->menu_order ) ) );
}

/**
 * Đóng dấu "bản nhập tự động": ghi hash trạng thái + mốc post_modified_gmt ngay sau khi script ghi.
 * Lần chạy sau, bài có post_modified_gmt lớn hơn mốc hoặc hash khác nghĩa là MKT đã sửa.
 *
 * @param int $post_id ID bài.
 */
function hvs_stamp_import( $post_id ) {
	clean_post_cache( $post_id );
	$post = get_post( $post_id );
	if ( ! $post ) {
		return;
	}
	update_post_meta( $post_id, 'hv_imported_hash', hvs_state_hash( $post ) );
	update_post_meta( $post_id, 'hv_imported_at', $post->post_modified_gmt );
}

/**
 * Script nhập/seed có được ghi đè bài này không?
 *  - bài chưa có: được;
 *  - bài trong thùng rác: không bao giờ (kể cả HV_IMPORT_FORCE; khôi phục khỏi thùng rác trước);
 *  - $force: được;
 *  - không còn publish (MKT gỡ xuống/nháp/riêng tư): không;
 *  - chưa có dấu nhập: chỉ khi nội dung đang trống (khung trang mới seed); bài cũ không rõ nguồn: không;
 *  - post_modified_gmt > mốc nhập hoặc hash khác: MKT đã sửa → không.
 *
 * @param int      $post_id        ID bài (0 = chưa có).
 * @param bool     $force          HV_IMPORT_FORCE.
 * @param string[] $extra_statuses Trạng thái ngoài 'publish' vẫn coi là "do script đặt" (vd. 'draft' cho bài CMS chưa xuất bản).
 * @return array{0:bool,1:string} [được ghi, lý do khi không được].
 */
function hvs_may_overwrite( $post_id, $force = false, array $extra_statuses = array() ) {
	if ( ! $post_id ) {
		return array( true, '' );
	}
	$post = get_post( $post_id );
	if ( ! $post ) {
		return array( true, '' );
	}
	if ( 'trash' === $post->post_status ) {
		return array( false, 'trash' );
	}
	if ( $force ) {
		return array( true, '' );
	}
	if ( 'publish' !== $post->post_status && ! in_array( $post->post_status, $extra_statuses, true ) ) {
		return array( false, 'status' );
	}
	$at   = (string) get_post_meta( $post_id, 'hv_imported_at', true );
	$hash = (string) get_post_meta( $post_id, 'hv_imported_hash', true );
	if ( '' === $at || '' === $hash ) {
		return '' === trim( $post->post_content ) && 'page' === $post->post_type ? array( true, '' ) : array( false, 'unmanaged' );
	}
	if ( $post->post_modified_gmt > $at ) {
		return array( false, 'modified' );
	}
	if ( hvs_state_hash( $post ) !== $hash ) {
		return array( false, 'edited' );
	}
	return array( true, '' );
}

/**
 * Tạo/cập nhật một tuyến phổ biến (CPT hv_route) theo đường dẫn tuyến.
 * Tuyến đã có (kể cả nháp/thùng rác) chỉ được cập nhật khi chưa bị MKT sửa (xem hvs_may_overwrite).
 *
 * @param array<string,mixed> $r      path,name,price,time,order,image (URL/file, tuỳ chọn), create_only (bool: tuyến đã có thì không đụng).
 * @param bool                $force  Ghi đè cả bản MKT đã sửa (không áp dụng cho thùng rác).
 * @param string|null         $status Ra: created|updated|kept|error.
 * @return int ID đã ghi, 0 nếu giữ nguyên hoặc lỗi.
 */
function hvs_upsert_route( array $r, $force = false, &$status = null ) {
	$found = get_posts(
		array(
			'post_type'        => 'hv_route',
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future', 'trash' ),
			'meta_key'         => 'hv_route_path', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'       => $r['path'], // phpcs:ignore WordPress.DB.SlowDBQuery
			'numberposts'      => 1,
			'fields'           => 'ids',
			'suppress_filters' => true,
		)
	);
	$existing = $found ? (int) $found[0] : 0;
	if ( $existing && ! empty( $r['create_only'] ) ) {
		$status = 'kept';
		return 0;
	}
	list( $ok ) = hvs_may_overwrite( $existing, $force );
	if ( ! $ok ) {
		$status = 'kept';
		return 0;
	}
	$post = array(
		'post_type'   => 'hv_route',
		'post_status' => 'publish',
		'post_title'  => hvs_clean_text( $r['name'] ),
		'menu_order'  => (int) ( $r['order'] ?? 0 ),
	);
	if ( $existing ) {
		$post['ID'] = $existing;
		$id         = wp_update_post( $post, true );
	} else {
		$id = wp_insert_post( $post, true );
	}
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( 'Tuyến ' . $r['path'] . ': ' . $id->get_error_message() );
		$status = 'error';
		return 0;
	}
	update_post_meta( $id, 'hv_route_path', $r['path'] );
	if ( isset( $r['price'] ) && '' !== $r['price'] ) {
		update_post_meta( $id, 'hv_route_price', $r['price'] );
	}
	if ( isset( $r['time'] ) && '' !== $r['time'] ) {
		update_post_meta( $id, 'hv_route_time', $r['time'] );
	}
	if ( ! empty( $r['image'] ) && ! has_post_thumbnail( $id ) ) {
		$att = hvs_sideload( $r['image'], $id, $r['name'] );
		if ( $att ) {
			set_post_thumbnail( $id, $att );
		}
	}
	hvs_stamp_import( (int) $id );
	$status = $existing ? 'updated' : 'created';
	return (int) $id;
}
