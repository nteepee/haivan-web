<?php
/**
 * CPT hv_promo "Chương trình giảm giá": MKT bật/tắt khứ hồi giảm theo ghế và combo theo ngày/giờ/ghế.
 *
 * Web KHÔNG tự trừ tiền. Giảm giá thật do hệ thống vé của Hải Vân (ERP) tính theo MÃ chương trình (ô "Mã"); web chỉ
 * hiện nhãn và gắn mã vào đơn khi khách đủ điều kiện. Vì vậy: chưa có mã thì không bật được, và mã không nằm trong dữ
 * liệu công khai (booking-config chỉ có has_code; mã ra qua /promo-codes với bí mật dùng chung) nhưng vẫn đi trong đơn đặt vé của khách,
 * nên IT phải giới hạn mã trong ERP theo tuyến, ngày, số lượng.
 * Dữ liệu xuất qua inc/booking-config.php (hợp đồng: plans/261029-1444-core-routes-search-promos/contract.md).
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const HV_PROMO_TYPES = array(
	'roundtrip' => 'Khứ hồi: giảm theo ghế ở chiều về',
	'combo'     => 'Combo: giá trọn gói theo số vé (đi nhóm, đặt sớm)',
);

const HV_PROMO_DIRECTIONS = array(
	'both' => 'Cả hai chiều',
	'ab'   => 'Chỉ chiều a → b',
	'ba'   => 'Chỉ chiều b → a',
);

/** Thứ trong tuần: 1 = thứ hai … 7 = chủ nhật (khớp contract). */
const HV_PROMO_WEEKDAYS = array(
	1 => 'T2',
	2 => 'T3',
	3 => 'T4',
	4 => 'T5',
	5 => 'T6',
	6 => 'T7',
	7 => 'CN',
);

add_action(
	'init',
	static function () {
		register_post_type(
			'hv_promo',
			array(
				'label'               => 'Chương trình giảm giá',
				'labels'              => array(
					'name'          => 'Chương trình giảm giá',
					'singular_name' => 'Chương trình giảm giá',
					'menu_name'     => 'Chương trình giảm giá',
					'all_items'     => 'Tất cả chương trình',
					'add_new'       => 'Thêm chương trình',
					'add_new_item'  => 'Thêm chương trình giảm giá',
					'edit_item'     => 'Sửa chương trình giảm giá',
					'new_item'      => 'Chương trình mới',
					'search_items'  => 'Tìm chương trình',
					'not_found'     => 'Chưa có chương trình giảm giá. Bấm "Thêm chương trình".',
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_rest'        => false,
				'exclude_from_search' => true,
				'supports'            => array( 'title' ),
				'menu_icon'           => 'dashicons-money-alt',
				'menu_position'       => 24,
			)
		);
	},
	5
);

add_filter(
	'enter_title_here',
	static fn( $text, $post ) => 'hv_promo' === $post->post_type ? 'Tên nội bộ, vd. Khứ hồi giảm 20k Sài Gòn – Vũng Tàu' : $text,
	10,
	2
);

/* ======================================================================
 * Đọc / chuẩn hoá
 * ==================================================================== */

/** Số tiền VND từ ô nhập: "419000", "419.000", "419k". Sai/<=0 = null. */
function hv_promo_parse_vnd( $v ) {
	$v = strtolower( trim( (string) $v ) );
	if ( 1 !== preg_match( '/^(\d[\d.,\s]*)(k?)$/', $v, $m ) ) {
		return null;
	}
	$n = (int) preg_replace( '/\D+/', '', $m[1] );
	$n = '' !== $m[2] ? $n * 1000 : $n;
	return $n > 0 && $n <= 100000000 ? $n : null;
}

/**
 * Dòng bậc giá combo "số vé | hạng xe | giá | giá gốc (tuỳ chọn)".
 *
 * @param string   $text   Nội dung ô.
 * @param string[] $errors Nhận lỗi.
 * @return array<int,array{seats:int,class:string,price_vnd:int,was_vnd:int|null}>
 */
function hv_promo_parse_tiers( $text, array &$errors = array() ) {
	$tiers = array();
	$n     = 0;
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $text ) ?: array() as $line ) {
		$line = trim( $line );
		if ( '' === $line ) {
			continue;
		}
		++$n;
		$c     = array_map( 'trim', explode( '|', $line ) );
		$seats = $c[0];
		$price = hv_promo_parse_vnd( $c[2] ?? '' );
		$was   = '' === ( $c[3] ?? '' ) ? null : hv_promo_parse_vnd( $c[3] );
		if ( ! ctype_digit( $seats ) || (int) $seats < 1 || (int) $seats > 9 ) {
			$errors[] = "Dòng {$n}: số vé phải từ 1 đến 9.";
		} elseif ( '' === ( $c[1] ?? '' ) ) {
			$errors[] = "Dòng {$n}: thiếu hạng xe.";
		} elseif ( null === $price ) {
			$errors[] = "Dòng {$n}: giá không hợp lệ (vd. 419000, 419.000 hoặc 419k).";
		} elseif ( '' !== ( $c[3] ?? '' ) && ( null === $was || $was < $price ) ) {
			$errors[] = "Dòng {$n}: giá gốc phải là số và không nhỏ hơn giá combo.";
		} else {
			$tiers[] = array( 'seats' => (int) $seats, 'class' => mb_substr( $c[1], 0, 40 ), 'price_vnd' => $price, 'was_vnd' => $was );
		}
	}
	return $tiers;
}

function hv_promo_tiers_to_text( array $tiers ) {
	return implode(
		"\n",
		array_map( static fn( $t ) => rtrim( $t['seats'] . ' | ' . $t['class'] . ' | ' . $t['price_vnd'] . ' | ' . ( $t['was_vnd'] ?? '' ), ' |' ), $tiers )
	);
}

/** Mã chương trình trên ERP: chữ, số, gạch ngang/dưới/chấm, 1 đến 40 ký tự. */
function hv_promo_valid_code( $code ) {
	return 1 === preg_match( '/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/', (string) $code );
}

/** "YYYY-MM-DD" hợp lệ hoặc ''. */
function hv_promo_date( $v ) {
	return hv_clean_when( (string) $v, false );
}

/** "HH:MM" hợp lệ hoặc ''. */
function hv_promo_time( $v ) {
	return 1 === preg_match( '/^(?:[01]\d|2[0-3]):[0-5]\d$/', (string) $v ) ? (string) $v : '';
}

/** Số nguyên không âm từ meta/ô nhập, null khi trống hoặc sai. */
function hv_promo_int( $v, $min = 0, $max = 1000000 ) {
	$v = trim( (string) $v );
	return ctype_digit( $v ) && (int) $v >= $min && (int) $v <= $max ? (int) $v : null;
}

/** Các mã tuyến hiện có (mọi bài hv_corridor có mã) => tên, cho ô chọn tuyến. */
function hv_promo_corridor_choices() {
	$out = array();
	foreach ( get_posts( array( 'post_type' => 'hv_corridor', 'post_status' => array( 'publish', 'draft' ), 'numberposts' => -1, 'orderby' => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ), 'suppress_filters' => true ) ) as $c ) {
		$id = (string) get_post_meta( $c->ID, 'hv_corridor_id', true );
		if ( hv_corridor_valid_id( $id ) ) {
			$out[ $id ] = $c->post_title;
		}
	}
	return $out;
}

/**
 * Dữ liệu một chương trình theo hợp đồng booking-config, hoặc null khi chưa đủ điều kiện để xuất
 * (thiếu mã, tuyến, mức giảm/bậc giá). Bật/tắt, trạng thái bài và ngày chạy do hv_booking_config lọc.
 *
 * @return array<string,mixed>|null
 */
function hv_promo_payload( $post_id ) {
	$m    = static fn( $k ) => trim( (string) get_post_meta( $post_id, 'hv_promo_' . $k, true ) );
	$type = isset( HV_PROMO_TYPES[ $m( 'type' ) ] ) ? $m( 'type' ) : '';
	$code = $m( 'code' );
	$corr = $m( 'corridor' );
	if ( '' === $type || ! hv_promo_valid_code( $code ) || ! hv_corridor_valid_id( $corr ) ) {
		return null;
	}
	$ignore = array();
	$per    = hv_promo_int( $m( 'per_seat_vnd' ), 1, 100000000 );
	$tiers  = hv_promo_parse_tiers( (string) get_post_meta( $post_id, 'hv_promo_tiers', true ), $ignore );
	if ( ( 'roundtrip' === $type && null === $per ) || ( 'combo' === $type && ! $tiers ) ) {
		return null;
	}
	$dir      = isset( HV_PROMO_DIRECTIONS[ $m( 'direction' ) ] ) ? $m( 'direction' ) : 'both';
	$days     = array_values( array_filter( array_map( 'intval', (array) get_post_meta( $post_id, 'hv_promo_weekdays', true ) ), static fn( $d ) => $d >= 1 && $d <= 7 ) );
	$days     = array_values( array_unique( $days ) );
	$from     = hv_promo_time( $m( 'hours_from' ) );
	$to       = hv_promo_time( $m( 'hours_to' ) );
	$smin     = hv_promo_int( $m( 'seats_min' ), 1, 9 ) ?? 1;
	$smax     = hv_promo_int( $m( 'seats_max' ), 1, 9 ) ?? 9;
	$d        = static fn( $k ) => '' !== hv_promo_date( $m( $k ) ) ? hv_promo_date( $m( $k ) ) : null;
	$per_k    = null !== $per ? (int) round( $per / 1000 ) : 0;
	$is_rt    = 'roundtrip' === $type;
	$dec      = static fn( $v ) => trim( html_entity_decode( (string) $v, ENT_QUOTES, 'UTF-8' ) ); // chữ thật trong JSON, không phải thực thể.
	$label_vi = $dec( $m( 'label_vi' ) );
	$badge_vi = $dec( $m( 'badge_vi' ) );
	// Nhãn mặc định chỉ dựng từ con số thật của chương trình (không bịa mức giảm).
	if ( '' === $label_vi ) {
		$label_vi = $is_rt ? 'Giảm ' . $per_k . 'k/ghế chiều về' : 'Combo đi nhóm';
	}
	if ( '' === $badge_vi ) {
		$badge_vi = $is_rt ? 'Khứ hồi -' . $per_k . 'k' : 'Combo';
	}
	$label_en = '' !== $m( 'label_en' ) ? $dec( $m( 'label_en' ) ) : ( '' !== $m( 'label_vi' ) ? $label_vi : ( $is_rt ? $per_k . 'k off per return seat' : 'Group combo' ) );
	$badge_en = '' !== $m( 'badge_en' ) ? $dec( $m( 'badge_en' ) ) : ( '' !== $m( 'badge_vi' ) ? $badge_vi : ( $is_rt ? 'Return -' . $per_k . 'k' : 'Combo' ) );
	return array(
		'id'                 => (int) $post_id,
		'type'               => $type,
		'corridor'           => $corr,
		'direction'          => $dir,
		'book_from'          => $d( 'book_from' ),
		'book_to'            => $d( 'book_to' ),
		'travel_from'        => $d( 'travel_from' ),
		'travel_to'          => $d( 'travel_to' ),
		'weekdays'           => $days && count( $days ) < 7 ? $days : null,
		'hours'              => '' !== $from && '' !== $to && $from < $to ? array( 'from' => $from, 'to' => $to ) : null,
		'book_ahead_minutes' => hv_promo_int( $m( 'book_ahead_minutes' ), 1, 100000 ),
		'seats'              => array( 'min' => min( $smin, $smax ), 'max' => max( $smin, $smax ) ),
		'per_seat_vnd'       => $is_rt ? $per : null,
		'tiers'              => 'combo' === $type ? $tiers : array(),
		'code'               => $code,
		'label'              => array( 'vi' => $label_vi, 'en' => $label_en ),
		'badge'              => array( 'vi' => $badge_vi, 'en' => $badge_en ),
	);
}

/* ======================================================================
 * Admin: ô nhập
 * ==================================================================== */

add_action(
	'add_meta_boxes',
	static function () {
		add_meta_box( 'hv-promo-switch', 'Bật / tắt và mã', 'hv_promo_box_switch', 'hv_promo', 'normal', 'high' );
		add_meta_box( 'hv-promo-rules', 'Điều kiện áp dụng', 'hv_promo_box_rules', 'hv_promo', 'normal', 'default' );
		add_meta_box( 'hv-promo-price', 'Mức giảm và nhãn', 'hv_promo_box_price', 'hv_promo', 'normal', 'default' );
		add_meta_box( 'hv-promo-help', 'Hướng dẫn', 'hv_promo_box_help', 'hv_promo', 'side', 'default' );
	}
);

function hv_promo_box_help() {
	echo '<p><strong>Giảm giá thật do hệ thống vé (ERP) của Hải Vân tính</strong> theo mã ở ô "Mã chương trình". Web chỉ hiện nhãn và gắn mã khi khách đủ điều kiện, không tự trừ tiền.</p>';
	echo '<p><strong>Chương trình không có mã thì không bật được</strong> và không hiện trên web.</p>';
	echo '<p><strong>Lưu ý cho bộ phận IT:</strong> mã không hiện trên trang công khai, nhưng vẫn nằm trong yêu cầu đặt vé của khách (xem được bằng công cụ trình duyệt). Trước khi bật, hãy giới hạn mã trong ERP theo tuyến, ngày áp dụng và số lượng.</p>';
	echo '<p><strong>Quyền:</strong> chỉ Biên tập viên trở lên (quyền sửa bài của người khác) mới bật chương trình hoặc đổi mã. Người khác lưu thì chương trình bị tắt và mã giữ nguyên.</p>';
	echo '<p>Chương trình tự ẩn khi qua "Đến hết ngày" ở mục Thời gian chạy hoặc khi bài là Nháp. Mức giảm và số tiền ở đây là giá tham khảo chỉ để hiển thị (giá thật do ERP tính); phải khớp với ERP.</p>';
}

function hv_promo_box_switch( $post ) {
	wp_nonce_field( 'hv_promo_save', 'hv_promo_nonce' );
	$g       = static fn( $k, $d = '' ) => (string) ( get_post_meta( $post->ID, 'hv_promo_' . $k, true ) ?: $d );
	$choices = hv_promo_corridor_choices();
	echo '<p><label><input type="checkbox" name="hv_promo_enabled" value="1"' . checked( $g( 'enabled' ), '1', false ) . '> <strong>Đang bật</strong> (hiện nhãn ưu đãi trên web và tự gắn mã vào đơn)</label></p>';
	echo '<p><label><strong>Mã chương trình trên hệ thống vé (ERP)</strong> <span style="color:#b32d2e">bắt buộc để bật</span><br><input class="regular-text" type="text" name="hv_promo_code" value="' . esc_attr( $g( 'code' ) ) . '" maxlength="40" autocomplete="off" spellcheck="false"></label><br>';
	echo '<span class="description">Gõ đúng như trong ERP (chữ, số, <code>- _ .</code>). Mã <strong>không</strong> hiện trong trang công khai hay booking-config (chỉ có <code>has_code</code>); server Next lấy mã qua endpoint riêng có bí mật dùng chung. Dù vậy mã vẫn đi trong yêu cầu đặt vé của khách, nên IT phải giới hạn mã trong ERP theo tuyến, ngày và số lượng trước khi bật.</span></p>';
	echo '<p><label><strong>Loại</strong><br><select name="hv_promo_type">';
	foreach ( HV_PROMO_TYPES as $k => $label ) {
		echo '<option value="' . esc_attr( $k ) . '"' . selected( $g( 'type', 'roundtrip' ), $k, false ) . '>' . esc_html( $label ) . '</option>';
	}
	echo '</select></label></p>';
	echo '<div class="hv-grid2"><p><label><strong>Tuyến</strong><br><select name="hv_promo_corridor"><option value="">- Chọn tuyến -</option>';
	foreach ( $choices as $id => $title ) {
		echo '<option value="' . esc_attr( $id ) . '"' . selected( $g( 'corridor' ), $id, false ) . '>' . esc_html( $title . ' (' . $id . ')' ) . '</option>';
	}
	echo '</select></label></p><p><label><strong>Chiều được giảm</strong><br><select name="hv_promo_direction">';
	foreach ( HV_PROMO_DIRECTIONS as $k => $label ) {
		echo '<option value="' . esc_attr( $k ) . '"' . selected( $g( 'direction', 'both' ), $k, false ) . '>' . esc_html( $label ) . '</option>';
	}
	echo '</select></label><br><span class="description">Với khứ hồi: chiều về được giảm. "Cả hai chiều" = chiều về nào cũng được giảm. a → b theo thứ tự tên tuyến.</span></p></div>';
}

function hv_promo_box_rules( $post ) {
	$g   = static fn( $k, $d = '' ) => (string) ( get_post_meta( $post->ID, 'hv_promo_' . $k, true ) ?: $d );
	$day = array_map( 'intval', (array) get_post_meta( $post->ID, 'hv_promo_weekdays', true ) );
	$in  = static function ( $key, $label, $type, $help = '', $attrs = '' ) use ( $g ) {
		echo '<p><label><strong>' . esc_html( $label ) . '</strong><br><input class="widefat" type="' . esc_attr( $type ) . '" name="hv_promo_' . esc_attr( $key ) . '" value="' . esc_attr( $g( $key ) ) . '" ' . $attrs . '></label>'; // phpcs:ignore WordPress.Security.EscapeOutput -- $attrs là hằng số trong file này.
		echo '' !== $help ? '<br><span class="description">' . wp_kses_post( $help ) . '</span>' : '';
		echo '</p>';
	};
	echo '<h4>Thời gian chạy (ngày đặt vé)</h4><div class="hv-grid2">';
	$in( 'book_from', 'Từ ngày', 'date', 'Trống = chạy ngay.' );
	$in( 'book_to', 'Đến hết ngày', 'date', 'Trống = không hết hạn. Qua ngày này chương trình tự ẩn.' );
	echo '</div><h4>Ngày đi được áp dụng</h4><div class="hv-grid2">';
	$in( 'travel_from', 'Chuyến đi từ ngày', 'date', 'Trống = không giới hạn.' );
	$in( 'travel_to', 'Chuyến đi đến hết ngày', 'date' );
	echo '</div><p><strong>Thứ trong tuần</strong> (không chọn hoặc chọn đủ 7 = mọi ngày)<br>';
	foreach ( HV_PROMO_WEEKDAYS as $n => $label ) {
		echo '<label style="margin-right:12px"><input type="checkbox" name="hv_promo_weekdays[]" value="' . (int) $n . '"' . checked( in_array( $n, $day, true ), true, false ) . '> ' . esc_html( $label ) . '</label>';
	}
	echo '</p><h4>Giờ xuất bến và đặt trước</h4><div class="hv-grid2">';
	$in( 'hours_from', 'Giờ xuất bến từ', 'time', 'Điền cả hai ô giờ hoặc để trống cả hai.' );
	$in( 'hours_to', 'Giờ xuất bến đến', 'time' );
	$in( 'book_ahead_minutes', 'Đặt trước tối thiểu (phút)', 'text', 'Trống = không yêu cầu.', 'inputmode="numeric" maxlength="6"' );
	echo '</div><h4>Số vé</h4><div class="hv-grid2">';
	$in( 'seats_min', 'Số vé tối thiểu (1 đến 9)', 'text', 'Trống = 1.', 'inputmode="numeric" maxlength="1"' );
	$in( 'seats_max', 'Số vé tối đa (1 đến 9)', 'text', 'Trống = 9.', 'inputmode="numeric" maxlength="1"' );
	echo '</div>';
}

function hv_promo_box_price( $post ) {
	$g = static fn( $k ) => (string) get_post_meta( $post->ID, 'hv_promo_' . $k, true );
	echo '<p><label><strong>Khứ hồi: mức giảm mỗi ghế chiều về (VND)</strong><br><input class="regular-text" type="text" name="hv_promo_per_seat_vnd" value="' . esc_attr( $g( 'per_seat_vnd' ) ) . '" inputmode="numeric" placeholder="20000"></label><br><span class="description">Chỉ để hiển thị (vd. 20000 hoặc 20k). Bắt buộc với loại Khứ hồi.</span></p>';
	echo '<p><label for="hv_promo_tiers"><strong>Combo: bậc giá theo số vé</strong></label><br><textarea class="widefat code" rows="6" id="hv_promo_tiers" name="hv_promo_tiers" spellcheck="false">' . esc_textarea( $g( 'tiers' ) ) . '</textarea><br>';
	echo '<span class="description">Mỗi dòng: <code>số vé | hạng xe | giá combo | giá gốc (tuỳ chọn)</code>, vd. <code>2 | Luxury | 419000 | 520000</code>. Đây là <strong>giá tham khảo</strong> để hiển thị; giá thật do hệ thống vé (ERP) tính. Bắt buộc với loại Combo.</span></p>';
	echo '<div class="hv-grid2">';
	foreach ( array( 'label_vi' => 'Nhãn (tiếng Việt)', 'label_en' => 'Nhãn (tiếng Anh)', 'badge_vi' => 'Huy hiệu ngắn (tiếng Việt)', 'badge_en' => 'Huy hiệu ngắn (tiếng Anh)' ) as $k => $label ) {
		$ph = array( 'label_vi' => 'Giảm 20k/ghế chiều về', 'label_en' => '20k off per return seat', 'badge_vi' => 'Khứ hồi -20k', 'badge_en' => 'Return -20k' );
		echo '<p><label><strong>' . esc_html( $label ) . '</strong><br><input class="widefat" type="text" name="hv_promo_' . esc_attr( $k ) . '" value="' . esc_attr( $g( $k ) ) . '" maxlength="80" placeholder="' . esc_attr( $ph[ $k ] ) . '"></label></p>';
	}
	echo '</div><p class="description">Nhãn hiện cạnh "Thêm ngày về" và trên thẻ chuyến. Để trống = tự dựng từ mức giảm ở trên. Chỉ ghi điều có thật trong ERP.</p>';
}

/* ======================================================================
 * Admin: lưu + kiểm tra
 * ==================================================================== */

add_action(
	'save_post_hv_promo',
	static function ( $post_id ) {
		if ( ! isset( $_POST['hv_promo_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hv_promo_nonce'] ) ), 'hv_promo_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$p      = static fn( $k ) => isset( $_POST[ 'hv_promo_' . $k ] ) ? trim( sanitize_text_field( wp_unslash( $_POST[ 'hv_promo_' . $k ] ) ) ) : '';
		$set    = static fn( $k, $v ) => update_post_meta( $post_id, 'hv_promo_' . $k, $v );
		$errors = array();

		$type = isset( HV_PROMO_TYPES[ $p( 'type' ) ] ) ? $p( 'type' ) : 'roundtrip';
		$dir  = isset( HV_PROMO_DIRECTIONS[ $p( 'direction' ) ] ) ? $p( 'direction' ) : 'both';
		$set( 'type', $type );
		$set( 'direction', $dir );

		$corr = $p( 'corridor' );
		if ( '' !== $corr && ! isset( hv_promo_corridor_choices()[ $corr ] ) ) {
			$errors[] = "Tuyến \"{$corr}\" không tồn tại; đã bỏ chọn.";
			$corr     = '';
		}
		$set( 'corridor', $corr );

		// Mã và bật/tắt là quyết định về tiền: chỉ Biên tập viên trở lên (edit_others_posts). Người khác lưu: giữ mã cũ, ép tắt.
		$can_enable = current_user_can( 'edit_others_posts' );
		$code       = $p( 'code' );
		if ( ! $can_enable ) {
			if ( $code !== (string) get_post_meta( $post_id, 'hv_promo_code', true ) ) {
				$errors[] = 'Chỉ Biên tập viên trở lên được đổi mã chương trình; mã cũ được giữ nguyên.';
			}
			$code = (string) get_post_meta( $post_id, 'hv_promo_code', true );
		} elseif ( '' !== $code && ! hv_promo_valid_code( $code ) ) {
			$errors[] = 'Mã chương trình chỉ gồm chữ, số và - _ . (tối đa 40 ký tự); đã xoá mã.';
			$code     = '';
		}
		$set( 'code', $code );

		// Ngày: sai định dạng thì bỏ; kết thúc trước bắt đầu thì báo và bỏ ngày kết thúc.
		foreach ( array( 'book' => 'Thời gian chạy', 'travel' => 'Ngày đi' ) as $k => $label ) {
			$from = $p( "{$k}_from" );
			$to   = $p( "{$k}_to" );
			$cf   = hv_promo_date( $from );
			$ct   = hv_promo_date( $to );
			if ( ( '' !== $from && '' === $cf ) || ( '' !== $to && '' === $ct ) ) {
				$errors[] = "{$label}: ngày không hợp lệ, đã bỏ ô sai.";
			}
			if ( '' !== $cf && '' !== $ct && $ct < $cf ) {
				$errors[] = "{$label}: ngày kết thúc trước ngày bắt đầu; đã bỏ ngày kết thúc.";
				$ct       = '';
			}
			$set( "{$k}_from", $cf );
			$set( "{$k}_to", $ct );
		}

		$days = array();
		if ( isset( $_POST['hv_promo_weekdays'] ) && is_array( $_POST['hv_promo_weekdays'] ) ) {
			$days = array_values( array_unique( array_filter( array_map( 'absint', wp_unslash( $_POST['hv_promo_weekdays'] ) ), static fn( $d ) => $d >= 1 && $d <= 7 ) ) );
			sort( $days );
		}
		$set( 'weekdays', $days );

		$hf = $p( 'hours_from' );
		$ht = $p( 'hours_to' );
		if ( '' !== $hf || '' !== $ht ) {
			if ( '' === hv_promo_time( $hf ) || '' === hv_promo_time( $ht ) || $hf >= $ht ) {
				$errors[] = 'Giờ xuất bến: điền cả hai ô theo dạng HH:MM và giờ bắt đầu phải trước giờ kết thúc; đã bỏ giới hạn giờ.';
				$hf       = '';
				$ht       = '';
			}
		}
		$set( 'hours_from', $hf );
		$set( 'hours_to', $ht );

		$ahead = $p( 'book_ahead_minutes' );
		if ( '' !== $ahead && null === hv_promo_int( $ahead, 1, 100000 ) ) {
			$errors[] = 'Số phút đặt trước phải là số nguyên dương; đã bỏ.';
			$ahead    = '';
		}
		$set( 'book_ahead_minutes', $ahead );

		$seats = array( 'min' => $p( 'seats_min' ), 'max' => $p( 'seats_max' ) );
		foreach ( array( 'min' => 'tối thiểu', 'max' => 'tối đa' ) as $k => $label ) {
			if ( '' !== $seats[ $k ] && null === hv_promo_int( $seats[ $k ], 1, 9 ) ) {
				$errors[]      = "Số vé {$label} phải từ 1 đến 9; đã bỏ.";
				$seats[ $k ] = '';
			}
		}
		if ( '' !== $seats['min'] && '' !== $seats['max'] && (int) $seats['min'] > (int) $seats['max'] ) {
			$errors[] = 'Số vé tối thiểu lớn hơn tối đa; đã đổi chỗ hai giá trị.';
			$seats    = array( 'min' => $seats['max'], 'max' => $seats['min'] );
		}
		$set( 'seats_min', $seats['min'] );
		$set( 'seats_max', $seats['max'] );

		// Mức giảm khứ hồi.
		$per_raw = $p( 'per_seat_vnd' );
		$per     = '' === $per_raw ? null : hv_promo_parse_vnd( $per_raw );
		if ( '' !== $per_raw && null === $per ) {
			$errors[] = 'Mức giảm mỗi ghế không hợp lệ (vd. 20000 hoặc 20k); đã bỏ.';
		}
		$set( 'per_seat_vnd', null === $per ? '' : (string) $per );

		// Bậc giá combo: mọi dòng hợp lệ mới lưu.
		$terrs = array();
		$tiers = hv_promo_parse_tiers( isset( $_POST['hv_promo_tiers'] ) ? sanitize_textarea_field( wp_unslash( $_POST['hv_promo_tiers'] ) ) : '', $terrs );
		if ( $terrs ) {
			foreach ( $terrs as $e ) {
				$errors[] = 'Bậc giá combo. ' . $e;
			}
			$errors[] = 'Bậc giá combo chưa được lưu (giữ bản cũ).';
		} else {
			$set( 'tiers', hv_promo_tiers_to_text( $tiers ) );
		}

		foreach ( array( 'label_vi', 'label_en', 'badge_vi', 'badge_en' ) as $k ) {
			$text = mb_substr( $p( $k ), 0, 80 );
			// Nhãn/huy hiệu hiện công khai: không được chứa mã ERP (so không phân biệt hoa thường).
			if ( '' !== $code && false !== mb_stripos( $text, $code ) ) {
				$errors[] = 'Nhãn/huy hiệu không được chứa mã chương trình (mã không công khai); đã xoá ô "' . $k . '".';
				$text     = '';
			}
			$set( $k, $text );
		}

		// Bật chương trình: bắt buộc có mã ERP, tuyến, và mức giảm/bậc giá khớp loại.
		$want_on = isset( $_POST['hv_promo_enabled'] );
		$why     = array();
		if ( ! hv_promo_valid_code( (string) get_post_meta( $post_id, 'hv_promo_code', true ) ) ) {
			$why[] = 'chưa có mã chương trình trên hệ thống vé (ERP)';
		}
		if ( '' === (string) get_post_meta( $post_id, 'hv_promo_corridor', true ) ) {
			$why[] = 'chưa chọn tuyến';
		}
		if ( 'roundtrip' === $type && null === hv_promo_int( get_post_meta( $post_id, 'hv_promo_per_seat_vnd', true ), 1, 100000000 ) ) {
			$why[] = 'loại Khứ hồi cần mức giảm mỗi ghế';
		}
		if ( 'combo' === $type && ! hv_promo_parse_tiers( (string) get_post_meta( $post_id, 'hv_promo_tiers', true ) ) ) {
			$why[] = 'loại Combo cần ít nhất một bậc giá';
		}
		if ( $want_on && $why ) {
			$errors[] = 'Chưa thể bật chương trình: ' . implode( '; ', $why ) . '. Chương trình đã được tắt.';
		}
		if ( ! $can_enable ) {
			if ( $want_on || '1' === (string) get_post_meta( $post_id, 'hv_promo_enabled', true ) ) {
				$errors[] = 'Chỉ Biên tập viên trở lên được bật chương trình giảm giá; chương trình đã được tắt.';
			}
			$want_on = false;
		}
		$set( 'enabled', $want_on && ! $why ? '1' : '0' );
		hv_admin_flash( $errors );
	}
);

/* Cột danh sách admin ------------------------------------------------------ */

add_filter(
	'manage_hv_promo_posts_columns',
	static fn( $cols ) => array(
		'cb'        => $cols['cb'] ?? '',
		'title'     => $cols['title'] ?? 'Chương trình',
		'hv_ptype'  => 'Loại và tuyến',
		'hv_pcode'  => 'Mã ERP',
		'hv_pstate' => 'Trạng thái',
	)
);
add_action(
	'manage_hv_promo_posts_custom_column',
	static function ( $col, $post_id ) {
		$m = static fn( $k ) => (string) get_post_meta( $post_id, 'hv_promo_' . $k, true );
		if ( 'hv_ptype' === $col ) {
			echo esc_html( ( HV_PROMO_TYPES[ $m( 'type' ) ] ?? '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<br><code>' . esc_html( $m( 'corridor' ) ) . '</code>';
		} elseif ( 'hv_pcode' === $col ) {
			echo '' !== $m( 'code' ) ? '<code>' . esc_html( $m( 'code' ) ) . '</code>' : '<em>Chưa có mã</em>';
		} elseif ( 'hv_pstate' === $col ) {
			$post = get_post( $post_id );
			if ( 'publish' !== $post->post_status ) {
				echo '<span class="hv-status hv-status--draft">Nháp (không hiện)</span>';
			} elseif ( '1' !== $m( 'enabled' ) ) {
				echo '<span class="hv-status hv-status--expired">Đang tắt</span>';
			} else {
				hv_admin_status_cell( $post, $m( 'book_from' ), $m( 'book_to' ) );
			}
		}
	},
	10,
	2
);
hv_admin_default_order( 'hv_promo' );
