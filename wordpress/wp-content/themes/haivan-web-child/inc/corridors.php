<?php
/**
 * CPT hv_corridor "Tuyến chính": 4 tuyến Sài Gòn – Vũng Tàu, Hà Nội – Điện Biên / Mộc Châu / Sơn La do MKT sửa.
 * Mỗi bài = một tuyến hai chiều: nhãn vi/en, hai đầu (tên + điểm tìm chuyến), trang landing mỗi chiều, giường nằm,
 * số ngày đặt tối đa, danh sách điểm đón/trả ở mỗi đầu. Dữ liệu xuất cho Next và ô tìm vé qua inc/booking-config.php
 * (hợp đồng: plans/261029-1444-core-routes-search-promos/contract.md).
 *
 * Mã tuyến (meta hv_corridor_id) là khoá ổn định mà Next, chương trình giảm giá và URL dùng; chỉ sửa khi hiểu hậu quả.
 * Điểm đón/trả nhập mỗi dòng một điểm: `mã | Tên vi | Tên en | Ghi chú | Tên điểm tìm chuyến, vĩ độ, kinh độ`
 * (ba ô cuối tuỳ chọn; ô cuối trống = dùng điểm của đầu tuyến). Kiểm tra khi lưu; dòng sai thì giữ nguyên dữ liệu cũ và báo lỗi.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Số điểm đón/trả tối đa mỗi đầu tuyến (chặn dữ liệu quá lớn trong JSON inline). */
const HV_CORRIDOR_MAX_STOPS = 60;

add_action(
	'init',
	static function () {
		register_post_type(
			'hv_corridor',
			array(
				'label'               => 'Tuyến chính',
				'labels'              => array(
					'name'          => 'Tuyến chính',
					'singular_name' => 'Tuyến chính',
					'menu_name'     => 'Tuyến chính',
					'all_items'     => 'Tất cả tuyến chính',
					'add_new'       => 'Thêm tuyến chính',
					'add_new_item'  => 'Thêm tuyến chính',
					'edit_item'     => 'Sửa tuyến chính',
					'new_item'      => 'Tuyến chính mới',
					'search_items'  => 'Tìm tuyến chính',
					'not_found'     => 'Chưa có tuyến chính. Bấm "Thêm tuyến chính".',
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_rest'        => false,
				'exclude_from_search' => true,
				'supports'            => array( 'title', 'thumbnail', 'page-attributes' ),
				'menu_icon'           => 'dashicons-location',
				'menu_position'       => 22,
			)
		);
	},
	5
);

hv_admin_default_order( 'hv_corridor' );

/* ======================================================================
 * Đọc / chuẩn hoá dữ liệu
 * ==================================================================== */

/** Ngày hôm nay theo giờ Việt Nam, "YYYY-MM-DD" (hạn chương trình, ngày đi tối thiểu tính theo giờ VN, không theo giờ máy chủ). */
function hv_today_vn() {
	return wp_date( 'Y-m-d', null, new DateTimeZone( 'Asia/Ho_Chi_Minh' ) );
}

/** Mã tuyến hợp lệ: chữ thường, số, gạch ngang. */
function hv_corridor_valid_id( $id ) {
	return 1 === preg_match( '/^[a-z0-9]+(?:-[a-z0-9]+)*$/', (string) $id ) && strlen( (string) $id ) <= 24;
}

/** Trang tuyến hợp lệ: đúng hai đoạn "a/b" (chữ thường, số, gạch ngang). Ba đoạn trở lên làm Next bỏ cả tuyến nên không nhận. */
function hv_corridor_valid_landing( $path ) {
	return 1 === preg_match( '#^[a-z0-9]+(?:-[a-z0-9]+)*/[a-z0-9]+(?:-[a-z0-9]+)*$#', (string) $path );
}

/** Toạ độ nằm trong khung Việt Nam (bắt nhầm vĩ độ/kinh độ bị đảo). */
function hv_corridor_valid_latlng( $lat, $lng ) {
	return is_numeric( $lat ) && is_numeric( $lng ) && (float) $lat >= 8 && (float) $lat <= 24 && (float) $lng >= 102 && (float) $lng <= 110.5;
}

/** Số thực toạ độ ("10.7753880" -> 10.775388). */
function hv_corridor_num( $v ) {
	return (float) $v;
}

/** Số thực thành chuỗi không mất chữ số (cấu hình `precision` mặc định 14 chữ số làm tròn toạ độ 15 chữ số). */
function hv_corridor_fmt( $f ) {
	return (string) wp_json_encode( (float) $f );
}

/**
 * Tách ô điểm tìm chuyến "Tên, lat, lng" (tên không chứa dấu phẩy). Rỗng = null (hợp lệ); sai định dạng = false.
 *
 * @return array{name:string,lat:float,lng:float}|null|false
 */
function hv_corridor_parse_point( $cell ) {
	$cell = trim( (string) $cell );
	if ( '' === $cell ) {
		return null;
	}
	$p = array_map( 'trim', explode( ',', $cell ) );
	if ( 3 !== count( $p ) || '' === $p[0] || ! hv_corridor_valid_latlng( $p[1], $p[2] ) ) {
		return false;
	}
	return array( 'name' => mb_substr( $p[0], 0, 80 ), 'lat' => hv_corridor_num( $p[1] ), 'lng' => hv_corridor_num( $p[2] ) );
}

/**
 * Phân tích ô nhiều dòng điểm đón/trả. Dòng sai bị bỏ khỏi kết quả và ghi vào $errors (lưu = từ chối; xuất = bỏ qua).
 *
 * @param string   $text   Nội dung ô.
 * @param string[] $errors Nhận danh sách lỗi (tiếng Việt, có số dòng).
 * @return array<int,array{id:string,vi:string,en:string,note:string,point:array|null}>
 */
function hv_corridor_parse_stops( $text, array &$errors = array() ) {
	$stops = array();
	$seen  = array();
	$n     = 0;
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $text ) ?: array() as $line ) {
		$line = trim( $line );
		if ( '' === $line ) {
			continue;
		}
		++$n;
		$c  = array_map( 'trim', explode( '|', $line ) );
		$id = $c[0];
		if ( ! hv_corridor_valid_id( $id ) ) {
			$errors[] = "Dòng {$n}: mã điểm \"{$id}\" chỉ gồm chữ thường, số, gạch ngang.";
			continue;
		}
		if ( isset( $seen[ $id ] ) ) {
			$errors[] = "Dòng {$n}: mã điểm \"{$id}\" bị trùng.";
			continue;
		}
		if ( '' === ( $c[1] ?? '' ) ) {
			$errors[] = "Dòng {$n}: thiếu tên tiếng Việt của điểm \"{$id}\".";
			continue;
		}
		if ( count( $c ) > 5 ) {
			$errors[] = "Dòng {$n}: thừa ô (ghi chú không được chứa dấu |).";
			continue;
		}
		$point = hv_corridor_parse_point( $c[4] ?? '' );
		if ( false === $point ) {
			$errors[] = "Dòng {$n}: điểm tìm chuyến của \"{$id}\" phải dạng \"Tên, vĩ độ, kinh độ\" nằm trong Việt Nam (vd. Sân bay Tân Sơn Nhất, 10.8184631, 106.6588245).";
			continue;
		}
		$seen[ $id ] = true;
		$stops[]     = array(
			'id'    => $id,
			'vi'    => mb_substr( $c[1], 0, 120 ),
			'en'    => mb_substr( '' !== ( $c[2] ?? '' ) ? $c[2] : $c[1], 0, 120 ),
			'note'  => mb_substr( $c[3] ?? '', 0, 200 ),
			'point' => $point,
		);
	}
	if ( count( $stops ) > HV_CORRIDOR_MAX_STOPS ) {
		$errors[] = 'Tối đa ' . HV_CORRIDOR_MAX_STOPS . ' điểm mỗi đầu tuyến.';
		$stops    = array_slice( $stops, 0, HV_CORRIDOR_MAX_STOPS );
	}
	return $stops;
}

/** Dựng lại ô nhiều dòng từ danh sách điểm đã phân tích (định dạng chuẩn, dùng để lưu). */
function hv_corridor_stops_to_text( array $stops ) {
	$lines = array();
	foreach ( $stops as $s ) {
		$pt      = $s['point'] ? $s['point']['name'] . ', ' . hv_corridor_fmt( $s['point']['lat'] ) . ', ' . hv_corridor_fmt( $s['point']['lng'] ) : '';
		$lines[] = rtrim( $s['id'] . ' | ' . $s['vi'] . ' | ' . $s['en'] . ' | ' . $s['note'] . ' | ' . $pt, ' |' );
	}
	return implode( "\n", $lines );
}

/**
 * Một đầu tuyến theo hợp đồng (vi, en, point) hoặc null khi thiếu tên/toạ độ.
 *
 * @return array{vi:string,en:string,point:array{name:string,lat:float,lng:float}}|null
 */
function hv_corridor_end( $post_id, $side ) {
	$m   = static fn( $k ) => trim( (string) get_post_meta( $post_id, "hv_corridor_{$side}_{$k}", true ) );
	$vi  = $m( 'vi' );
	$pn  = $m( 'point_name' );
	$lat = $m( 'lat' );
	$lng = $m( 'lng' );
	if ( '' === $vi || '' === $pn || ! hv_corridor_valid_latlng( $lat, $lng ) ) {
		return null;
	}
	return array(
		'vi'    => $vi,
		'en'    => '' !== $m( 'en' ) ? $m( 'en' ) : $vi,
		'point' => array( 'name' => $pn, 'lat' => hv_corridor_num( $lat ), 'lng' => hv_corridor_num( $lng ) ),
	);
}

/**
 * Tuyến theo hợp đồng booking-config, hoặc null khi dữ liệu chưa đủ (thiếu mã, đầu tuyến, điểm đón/trả).
 * Không kiểm tra bật/tắt hay trạng thái bài (do hv_booking_config lọc).
 *
 * @return array<string,mixed>|null
 */
function hv_corridor_payload( $post_id ) {
	$id = (string) get_post_meta( $post_id, 'hv_corridor_id', true );
	$a  = hv_corridor_end( $post_id, 'a' );
	$b  = hv_corridor_end( $post_id, 'b' );
	if ( ! hv_corridor_valid_id( $id ) || ! $a || ! $b ) {
		return null;
	}
	$ignore = array();
	$stops  = array(
		'a' => hv_corridor_parse_stops( (string) get_post_meta( $post_id, 'hv_corridor_stops_a', true ), $ignore ),
		'b' => hv_corridor_parse_stops( (string) get_post_meta( $post_id, 'hv_corridor_stops_b', true ), $ignore ),
	);
	if ( ! $stops['a'] || ! $stops['b'] ) {
		return null;
	}
	$default = array();
	foreach ( array( 'a', 'b' ) as $side ) {
		$want            = (string) get_post_meta( $post_id, "hv_corridor_default_{$side}", true );
		$ids             = array_column( $stops[ $side ], 'id' );
		$default[ $side ] = in_array( $want, $ids, true ) ? $want : $ids[0];
	}
	$landing = static function ( $k ) use ( $post_id ) {
		$v = trim( (string) get_post_meta( $post_id, "hv_corridor_landing_{$k}", true ), '/' );
		return hv_corridor_valid_landing( $v ) ? $v : null;
	};
	// Tiêu đề thô (không qua bộ lọc the_title), giải mã thực thể: JSON cho Next phải là chữ thật, không phải "&amp;".
	$label_vi = trim( html_entity_decode( (string) get_post_field( 'post_title', $post_id, 'raw' ), ENT_QUOTES, 'UTF-8' ) );
	if ( '' === $label_vi ) {
		return null;
	}
	$label_en = trim( html_entity_decode( (string) get_post_meta( $post_id, 'hv_corridor_label_en', true ), ENT_QUOTES, 'UTF-8' ) );
	$days     = (int) get_post_meta( $post_id, 'hv_corridor_max_days', true );
	return array(
		'id'           => $id,
		'label'        => array( 'vi' => $label_vi, 'en' => '' !== $label_en ? $label_en : $label_vi ),
		'ends'         => array( 'a' => $a, 'b' => $b ),
		'landing'      => array( 'ab' => $landing( 'ab' ), 'ba' => $landing( 'ba' ) ),
		'sleeper'      => '1' === (string) get_post_meta( $post_id, 'hv_corridor_sleeper', true ),
		'max_days'     => $days >= 1 && $days <= 60 ? $days : 29,
		'stops'        => $stops,
		'default_stop' => $default,
	);
}

/**
 * Các tuyến đang bật (đã xuất bản, bật, đủ dữ liệu), theo thứ tự "Thứ tự". Mã trùng: tuyến đầu tiên thắng.
 *
 * @return array<int,array<string,mixed>>
 */
function hv_corridors_enabled() {
	$posts = get_posts(
		array(
			'post_type'        => 'hv_corridor',
			'post_status'      => 'publish',
			'numberposts'      => -1, // không chặn số tuyến; thứ tự theo "Thứ tự" rồi ID.
			'orderby'          => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
			'suppress_filters' => true, // tuyến dùng chung cho vi/en.
			'meta_key'         => 'hv_corridor_enabled', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'       => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
		)
	);
	$out = array();
	foreach ( $posts as $p ) {
		$c = hv_corridor_payload( $p->ID );
		if ( $c && ! isset( $out[ $c['id'] ] ) ) {
			$out[ $c['id'] ] = $c;
		}
	}
	return array_values( $out );
}

/** Điểm tìm chuyến của một điểm đón/trả (điểm riêng, hoặc điểm của đầu tuyến). */
function hv_corridor_stop_point( array $corridor, $side, $stop_id ) {
	foreach ( $corridor['stops'][ $side ] as $s ) {
		if ( $s['id'] === $stop_id ) {
			return $s['point'] ?: $corridor['ends'][ $side ]['point'];
		}
	}
	return $corridor['ends'][ $side ]['point'];
}

/**
 * Link tìm chuyến điền sẵn theo điểm đón/trả mặc định, đúng định dạng buildSearchUrl của Next
 * (from/to = "tên,lat,lng" mã hoá cả cụm; ngày để trống vì trang đặt vé tự lấy hôm nay giờ VN, tránh ngày cũ trong trang đã cache).
 *
 * @param string $dir 'ab' | 'ba'.
 */
function hv_corridor_search_url( array $corridor, $dir ) {
	$ab   = 'ba' !== $dir;
	$from = $ab ? 'a' : 'b';
	$to   = $ab ? 'b' : 'a';
	$fs   = $corridor['default_stop'][ $from ];
	$ts   = $corridor['default_stop'][ $to ];
	$pt   = static fn( $p ) => rawurlencode( $p['name'] . ',' . hv_corridor_fmt( $p['lat'] ) . ',' . hv_corridor_fmt( $p['lng'] ) );
	$q    = array(
		'from=' . $pt( hv_corridor_stop_point( $corridor, $from, $fs ) ),
		'to=' . $pt( hv_corridor_stop_point( $corridor, $to, $ts ) ),
		'numberGuest=1',
		'type=2',
		'tuyen=' . rawurlencode( $corridor['id'] ),
		'chieu=' . ( $ab ? 'ab' : 'ba' ),
		'diem_di=' . rawurlencode( $fs ),
		'diem_den=' . rawurlencode( $ts ),
	);
	return hv_lang_prefix() . '/xe-khach/tim-chuyen?' . implode( '&', $q );
}

/* ======================================================================
 * Thông báo admin (lỗi kiểm tra khi lưu), dùng chung với hv_promo
 * ==================================================================== */

/** Xếp thông báo hiện ở lần tải màn hình sửa kế tiếp của người dùng này. */
function hv_admin_flash( array $messages, $type = 'error' ) {
	if ( ! $messages ) {
		return;
	}
	$key  = 'hv_flash_' . get_current_user_id();
	$list = get_transient( $key );
	$list = is_array( $list ) ? $list : array();
	foreach ( $messages as $m ) {
		$list[] = array( 'type' => $type, 'text' => (string) $m );
	}
	set_transient( $key, $list, 5 * MINUTE_IN_SECONDS );
}

add_action(
	'admin_notices',
	static function () {
		$key  = 'hv_flash_' . get_current_user_id();
		$list = get_transient( $key );
		$s    = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! is_array( $list ) || ! $s || ! in_array( $s->post_type, array( 'hv_corridor', 'hv_promo' ), true ) ) {
			return;
		}
		delete_transient( $key );
		foreach ( $list as $n ) {
			$cls = 'warning' === $n['type'] ? 'notice-warning' : 'notice-error';
			echo '<div class="notice ' . esc_attr( $cls ) . ' is-dismissible"><p>' . esc_html( $n['text'] ) . '</p></div>';
		}
	}
);

/* ======================================================================
 * Admin: ô nhập
 * ==================================================================== */

add_action(
	'add_meta_boxes',
	static function () {
		add_meta_box( 'hv-corridor-main', 'Tuyến', 'hv_corridor_box_main', 'hv_corridor', 'normal', 'high' );
		add_meta_box( 'hv-corridor-ends', 'Hai đầu tuyến', 'hv_corridor_box_ends', 'hv_corridor', 'normal', 'default' );
		add_meta_box( 'hv-corridor-stops', 'Điểm đón và trả', 'hv_corridor_box_stops', 'hv_corridor', 'normal', 'default' );
		add_meta_box( 'hv-corridor-help', 'Hướng dẫn', 'hv_corridor_box_help', 'hv_corridor', 'side', 'default' );
	}
);

add_filter(
	'enter_title_here',
	static fn( $text, $post ) => 'hv_corridor' === $post->post_type ? 'Tên tuyến tiếng Việt, vd. Hà Nội – Mộc Châu' : $text,
	10,
	2
);

function hv_corridor_box_help() {
	echo '<p>Bốn tuyến chính hiện ở ô tìm vé và khối "Tuyến phổ biến" của trang chủ, cùng dữ liệu cho trang đặt vé (<code>/wp-json/haivan-web/v1/booking-config</code>).</p>';
	echo '<p><strong>Tên tuyến</strong> là tiêu đề bài (tiếng Việt). <strong>Thứ tự</strong>: ô "Thứ tự" ở khung Thuộc tính trang, số nhỏ hiện trước. <strong>Ảnh</strong>: Ảnh đại diện (thẻ ở trang chủ).</p>';
	echo '<p>Tắt <em>Đang bật</em> hoặc để Nháp = tuyến biến mất khỏi ô tìm vé và trang chủ. Tuyến thiếu mã, đầu tuyến hoặc điểm đón/trả sẽ không được xuất.</p>';
	echo '<p><strong>Mã tuyến</strong> là khoá cố định mà trang đặt vé và chương trình giảm giá dùng. Không đổi sau khi tuyến đã chạy.</p>';
}

function hv_corridor_box_main( $post ) {
	wp_nonce_field( 'hv_corridor_save', 'hv_corridor_nonce' );
	$g = static fn( $k, $d = '' ) => (string) ( get_post_meta( $post->ID, 'hv_corridor_' . $k, true ) ?: $d );
	$i = static function ( $key, $label, $val, $help = '', $attrs = '' ) {
		echo '<p><label><strong>' . esc_html( $label ) . '</strong><br><input class="widefat" type="text" name="hv_corridor_' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '" ' . $attrs . '></label>'; // phpcs:ignore WordPress.Security.EscapeOutput -- $attrs là hằng số trong file này.
		echo '' !== $help ? '<br><span class="description">' . wp_kses_post( $help ) . '</span>' : '';
		echo '</p>';
	};
	echo '<p><label><input type="checkbox" name="hv_corridor_enabled" value="1"' . checked( $g( 'enabled' ), '1', false ) . '> <strong>Đang bật</strong> (hiện ở ô tìm vé, trang chủ và booking-config)</label></p>';
	$i( 'id', 'Mã tuyến', $g( 'id' ), 'Chữ thường, số, gạch ngang (vd. <code>hn-moc</code>). Duy nhất, không đổi sau khi chạy.', 'maxlength="24" pattern="[a-z0-9]+(-[a-z0-9]+)*" required' );
	$i( 'label_en', 'Tên tuyến tiếng Anh', $g( 'label_en' ), 'Để trống = dùng tên tiếng Việt.', 'maxlength="80"' );
	echo '<div class="hv-grid2">';
	$i( 'landing_ab', 'Trang tuyến chiều đi (a → b)', $g( 'landing_ab' ), 'Đúng hai đoạn <code>my-dinh/moc-chau</code> (thành /xe-khach/my-dinh/moc-chau). Để trống = chưa có trang, thẻ trang chủ dẫn thẳng tới tìm chuyến.', 'maxlength="80"' );
	$i( 'landing_ba', 'Trang tuyến chiều về (b → a)', $g( 'landing_ba' ), 'Như trên, cho chiều ngược lại.', 'maxlength="80"' );
	echo '</div><div class="hv-grid2">';
	$i( 'max_days', 'Đặt trước tối đa (ngày)', $g( 'max_days', '29' ), 'Ngày đi tối đa = hôm nay (giờ Việt Nam) + số này. Từ 1 đến 60.', 'inputmode="numeric" maxlength="2"' );
	echo '<p><label><input type="checkbox" name="hv_corridor_sleeper" value="1"' . checked( $g( 'sleeper' ), '1', false ) . '> <strong>Xe giường nằm qua đêm</strong></label><br><span class="description">Bật = ngày về tối thiểu là ngày đi + 1.</span></p>';
	echo '</div>';
}

function hv_corridor_box_ends( $post ) {
	$g = static fn( $k ) => (string) get_post_meta( $post->ID, 'hv_corridor_' . $k, true );
	echo '<p class="description">Đầu a là đầu thứ nhất của tên tuyến (vd. Hà Nội), đầu b là đầu thứ hai. <strong>Điểm tìm chuyến</strong> là toạ độ gửi cho hệ thống vé khi điểm đón/trả không có toạ độ riêng (lấy từ danh sách điểm của hệ thống vé).</p>';
	echo '<div class="hv-grid2">';
	foreach ( array( 'a' => 'Đầu a', 'b' => 'Đầu b' ) as $side => $title ) {
		echo '<fieldset class="hv-end"><legend><strong>' . esc_html( $title ) . '</strong></legend>';
		foreach ( array( 'vi' => 'Tên tiếng Việt (vd. Hà Nội)', 'en' => 'Tên tiếng Anh (vd. Hanoi)', 'point_name' => 'Tên điểm tìm chuyến (vd. Bến xe Mỹ Đình)', 'lat' => 'Vĩ độ (vd. 21.0284297)', 'lng' => 'Kinh độ (vd. 105.7782687)' ) as $k => $label ) {
			echo '<p><label>' . esc_html( $label ) . '<br><input class="widefat" type="text" name="hv_corridor_' . esc_attr( "{$side}_{$k}" ) . '" value="' . esc_attr( $g( "{$side}_{$k}" ) ) . '"' . ( in_array( $k, array( 'lat', 'lng' ), true ) ? ' inputmode="decimal"' : '' ) . '></label></p>';
		}
		echo '</fieldset>';
	}
	echo '</div>';
}

function hv_corridor_box_stops( $post ) {
	$g = static fn( $k ) => (string) get_post_meta( $post->ID, 'hv_corridor_' . $k, true );
	echo '<p class="description">Mỗi dòng một điểm: <code>mã | Tên tiếng Việt | Tên tiếng Anh | Ghi chú | Tên điểm tìm chuyến, vĩ độ, kinh độ</code>. Chỉ mã và tên tiếng Việt là bắt buộc. Ghi chú ghi vào đơn đặt vé khi khách chọn điểm này. Ô cuối chỉ điền khi điểm này tìm chuyến theo toạ độ khác đầu tuyến (vd. Sân bay Tân Sơn Nhất). Điểm đầu tiên là điểm mặc định nếu ô "mặc định" để trống.</p>';
	echo '<div class="hv-grid2">';
	foreach ( array( 'a' => 'Điểm ở đầu a', 'b' => 'Điểm ở đầu b' ) as $side => $title ) {
		echo '<div><p><label for="hv_corridor_stops_' . esc_attr( $side ) . '"><strong>' . esc_html( $title ) . '</strong></label><br>';
		echo '<textarea class="widefat code" rows="10" id="hv_corridor_stops_' . esc_attr( $side ) . '" name="hv_corridor_stops_' . esc_attr( $side ) . '" spellcheck="false">' . esc_textarea( $g( "stops_{$side}" ) ) . '</textarea></p>';
		echo '<p><label>Mã điểm mặc định<br><input class="widefat" type="text" name="hv_corridor_default_' . esc_attr( $side ) . '" value="' . esc_attr( $g( "default_{$side}" ) ) . '" maxlength="24"></label></p></div>';
	}
	echo '</div>';
}

/* ======================================================================
 * Admin: lưu + kiểm tra
 * ==================================================================== */

add_action(
	'save_post_hv_corridor',
	static function ( $post_id ) {
		if ( ! isset( $_POST['hv_corridor_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hv_corridor_nonce'] ) ), 'hv_corridor_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$p      = static fn( $k ) => isset( $_POST[ 'hv_corridor_' . $k ] ) ? trim( sanitize_text_field( wp_unslash( $_POST[ 'hv_corridor_' . $k ] ) ) ) : '';
		$errors = array();
		$set    = static fn( $k, $v ) => update_post_meta( $post_id, 'hv_corridor_' . $k, $v );

		// Mã tuyến: hợp lệ và duy nhất. Sai -> giữ mã cũ.
		$id  = $p( 'id' );
		$old = (string) get_post_meta( $post_id, 'hv_corridor_id', true );
		if ( ! hv_corridor_valid_id( $id ) ) {
			$errors[] = 'Mã tuyến chỉ gồm chữ thường, số, gạch ngang (tối đa 24 ký tự).' . ( '' !== $old ? ' Giữ mã cũ: ' . $old . '.' : '' );
		} elseif ( hv_corridor_id_taken( $id, $post_id ) ) {
			$errors[] = "Mã tuyến \"{$id}\" đã dùng cho tuyến khác." . ( '' !== $old ? ' Giữ mã cũ: ' . $old . '.' : '' );
		} else {
			$set( 'id', $id );
		}

		$set( 'label_en', mb_substr( $p( 'label_en' ), 0, 80 ) );
		foreach ( array( 'ab', 'ba' ) as $k ) {
			$v = trim( $p( "landing_{$k}" ), '/' );
			if ( '' !== $v && ! hv_corridor_valid_landing( $v ) ) {
				$errors[] = "Trang tuyến \"{$v}\" phải đúng hai đoạn a/b (vd. my-dinh/moc-chau), không nhận ba đoạn; đã để trống.";
				$v        = '';
			}
			$set( "landing_{$k}", $v );
		}
		$days = $p( 'max_days' );
		if ( '' === $days || ! ctype_digit( $days ) || (int) $days < 1 || (int) $days > 60 ) {
			$errors[] = 'Số ngày đặt trước phải từ 1 đến 60; đã dùng 29.';
			$days     = '29';
		}
		$set( 'max_days', (string) (int) $days );
		$set( 'sleeper', isset( $_POST['hv_corridor_sleeper'] ) ? '1' : '0' );

		// Hai đầu tuyến: tên + điểm tìm chuyến + toạ độ trong Việt Nam.
		foreach ( array( 'a', 'b' ) as $side ) {
			foreach ( array( 'vi', 'en', 'point_name' ) as $k ) {
				$set( "{$side}_{$k}", mb_substr( $p( "{$side}_{$k}" ), 0, 80 ) );
			}
			$lat = str_replace( ',', '.', $p( "{$side}_lat" ) );
			$lng = str_replace( ',', '.', $p( "{$side}_lng" ) );
			if ( ( '' !== $lat || '' !== $lng ) && ! hv_corridor_valid_latlng( $lat, $lng ) ) {
				$errors[] = "Đầu {$side}: toạ độ phải là số trong Việt Nam (vĩ độ 8 đến 24, kinh độ 102 đến 110.5); kiểm tra có bị đảo vĩ độ/kinh độ không. Giữ toạ độ cũ.";
			} else {
				$set( "{$side}_lat", $lat ); // giữ chuỗi gốc đã kiểm tra, không làm tròn.
				$set( "{$side}_lng", $lng );
			}
		}

		// Điểm đón/trả: mọi dòng hợp lệ mới lưu, ngược lại giữ nguyên bản cũ.
		foreach ( array( 'a', 'b' ) as $side ) {
			$errs  = array();
			$stops = hv_corridor_parse_stops( isset( $_POST[ "hv_corridor_stops_{$side}" ] ) ? sanitize_textarea_field( wp_unslash( $_POST[ "hv_corridor_stops_{$side}" ] ) ) : '', $errs );
			if ( $errs ) {
				foreach ( $errs as $e ) {
					$errors[] = "Điểm ở đầu {$side}. {$e}";
				}
				$errors[] = "Danh sách điểm ở đầu {$side} chưa được lưu (giữ bản cũ).";
			} else {
				$set( "stops_{$side}", hv_corridor_stops_to_text( $stops ) );
			}
			$default = $p( "default_{$side}" );
			$ids     = array_column( hv_corridor_parse_stops( (string) get_post_meta( $post_id, "hv_corridor_stops_{$side}", true ) ), 'id' );
			if ( '' !== $default && ! in_array( $default, $ids, true ) ) {
				$errors[] = "Mã điểm mặc định \"{$default}\" ở đầu {$side} không có trong danh sách; dùng điểm đầu tiên.";
				$default  = '';
			}
			$set( "default_{$side}", $default );
		}

		// Bật tuyến cần đủ dữ liệu; thiếu thì tắt và báo.
		$want_on = isset( $_POST['hv_corridor_enabled'] );
		$ok      = null !== hv_corridor_payload( $post_id );
		if ( $want_on && ! $ok ) {
			$errors[] = 'Chưa thể bật tuyến: cần tên tuyến (tiêu đề), mã tuyến hợp lệ, đủ tên và toạ độ hai đầu, và ít nhất một điểm đón/trả ở mỗi đầu. Tuyến đã được tắt.';
		}
		$set( 'enabled', $want_on && $ok ? '1' : '0' );
		hv_admin_flash( $errors );
	}
);

/** Mã tuyến đã dùng bởi bài hv_corridor khác (kể cả nháp/thùng rác để khỏi nhầm khi khôi phục). */
function hv_corridor_id_taken( $id, $except_id ) {
	$ids = get_posts(
		array(
			'post_type'        => 'hv_corridor',
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future', 'trash' ),
			'numberposts'      => 1,
			'fields'           => 'ids',
			'post__not_in'     => array( (int) $except_id ),
			'meta_key'         => 'hv_corridor_id', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'       => $id, // phpcs:ignore WordPress.DB.SlowDBQuery
			'suppress_filters' => true,
		)
	);
	return (bool) $ids;
}

/* Cột danh sách admin ------------------------------------------------------ */

add_filter(
	'manage_hv_corridor_posts_columns',
	static fn( $cols ) => array(
		'cb'           => $cols['cb'] ?? '',
		'title'        => $cols['title'] ?? 'Tên tuyến',
		'hv_cid'       => 'Mã tuyến',
		'hv_cstops'    => 'Điểm đón/trả',
		'hv_cstate'    => 'Trạng thái',
		'menu_order'   => 'Thứ tự',
	)
);
add_action(
	'manage_hv_corridor_posts_custom_column',
	static function ( $col, $post_id ) {
		if ( 'hv_cid' === $col ) {
			echo '<code>' . esc_html( (string) get_post_meta( $post_id, 'hv_corridor_id', true ) ) . '</code>';
		} elseif ( 'hv_cstops' === $col ) {
			$e = array();
			$a = count( hv_corridor_parse_stops( (string) get_post_meta( $post_id, 'hv_corridor_stops_a', true ), $e ) );
			$b = count( hv_corridor_parse_stops( (string) get_post_meta( $post_id, 'hv_corridor_stops_b', true ), $e ) );
			echo esc_html( "a: {$a} · b: {$b}" );
		} elseif ( 'hv_cstate' === $col ) {
			$post = get_post( $post_id );
			$on   = '1' === (string) get_post_meta( $post_id, 'hv_corridor_enabled', true );
			if ( 'publish' !== $post->post_status ) {
				echo '<span class="hv-status hv-status--draft">Nháp (không hiện)</span>';
			} elseif ( ! $on ) {
				echo '<span class="hv-status hv-status--expired">Đang tắt</span>';
			} elseif ( null === hv_corridor_payload( $post_id ) ) {
				echo '<span class="hv-status hv-status--upcoming">Thiếu dữ liệu</span>';
			} else {
				echo '<span class="hv-status hv-status--active">Đang bật</span>';
			}
		} elseif ( 'menu_order' === $col ) {
			echo (int) get_post_field( 'menu_order', $post_id );
		}
	},
	10,
	2
);
