<?php
/**
 * Shortcode [haivan_search]: form tìm vé xe liên tỉnh (JS thuần, assets/js/search.js).
 *
 * Hai chế độ trong cùng một thẻ:
 *  - Tuyến chính (mặc định khi có tuyến bật trong hv_corridor): 4 nút tuyến, điểm đi/đến là điểm đón/trả thật của tuyến,
 *    "Thêm ngày về" tuỳ chọn, số vé 1 đến 9, hàng "Chuyến hôm nay" theo khung giờ. Dữ liệu = hv_booking_config() nhúng JSON
 *    inline (không gọi REST lần nữa). Gửi form: /xe-khach/tim-chuyen?from=<tên,lat,lng mã hoá>&to=...&date=DD-MM-YYYY&numberGuest=N&type=2
 *    + tuyen, chieu, diem_di, diem_den, ngay_ve (contract.md).
 *  - Tìm theo điểm đi/đến (liên kết "Đi tỉnh khác?"): danh sách điểm GET https://apigw.haivan.com/api/places?type=0
 *    (header Domain: haivan.com, chỉ đọc). Gửi form: GET /xe-khach/tim-chuyen?from=<tên>,<lat>,<lng>&to=...&date=DD-MM-YYYY&numberGuest=N
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Nhãn form theo ngôn ngữ (docs/reference/locales/*: search.*). */
function hv_search_labels( $lang ) {
	$vi = array(
		'intercity'   => 'Xe liên tỉnh',
		'airport'     => 'Xe sân bay',
		'contract'    => 'Xe hợp đồng',
		'rental'      => 'Xe du lịch',
		'from'        => 'Điểm xuất phát',
		'to'          => 'Điểm đến',
		'from_ph'     => 'Chọn điểm xuất phát',
		'to_ph'       => 'Chọn điểm đến',
		'date'        => 'Ngày đi',
		'guests'      => 'Số người',
		'guests_dec'  => 'Giảm số người',
		'guests_inc'  => 'Tăng số người',
		'submit'      => 'Tìm vé',
		'swap'        => 'Đổi chiều',
		'no_match'    => 'Không có điểm phù hợp',
		'loading'     => 'Đang tải danh sách điểm...',
		'load_error'  => 'Không tải được danh sách điểm. Vui lòng thử lại.',
		'err_from'    => 'Vui lòng chọn điểm xuất phát.',
		'err_to'      => 'Vui lòng chọn điểm đến.',
		'err_date'    => 'Ngày đi không hợp lệ (từ hôm nay đến 4 tháng tới).',
		'err_guests'  => 'Số người phải từ 1 trở lên.',
	);
	$en = array(
		'intercity'   => 'Bus',
		'airport'     => 'Airport bus',
		'contract'    => 'Airport taxi',
		'rental'      => 'Car hire',
		'from'        => 'From',
		'to'          => 'To',
		'from_ph'     => 'Select starting point',
		'to_ph'       => 'Select destination',
		'date'        => 'Departure date',
		'guests'      => 'Guests',
		'guests_dec'  => 'Decrease guests',
		'guests_inc'  => 'Increase guests',
		'submit'      => 'Search',
		'swap'        => 'Swap',
		'no_match'    => 'No matching place',
		'loading'     => 'Loading places...',
		'load_error'  => 'Could not load places. Please try again.',
		'err_from'    => 'Please select a starting point.',
		'err_to'      => 'Please select a destination.',
		'err_date'    => 'Invalid date (from today up to 4 months ahead).',
		'err_guests'  => 'Number of guests must be at least 1.',
	);
	return 'en' === $lang ? $en : $vi;
}

/**
 * Nhãn chế độ tuyến chính cho JS (khoá ngắn -> chuỗi theo ngôn ngữ). Chuỗi gốc ở inc/i18n-labels.php (khoá sc_*).
 *
 * @return array<string,string>
 */
function hv_search_corridor_labels( $lang ) {
	$out = array();
	foreach ( array( 'ticket_1', 'ticket_n', 'trip_1', 'trip_n', 'pair', 'loading', 'load_error', 'none_today', 'err_stop', 'err_date', 'err_return', 'err_return_sl', 'err_guests' ) as $k ) {
		$out[ $k ] = hv_t( 'sc_' . $k, $lang );
	}
	return $out;
}

/**
 * Thuộc tính shortcode dạng đường dẫn nội bộ: chỉ nhận "/a/b-c" (chữ thường, số, gạch ngang, gạch chéo đơn).
 * Mọi thứ khác ("\\evil.com", "//evil.com", "https:...", rỗng) → $default. Tránh chuyển hướng ra ngoài site.
 *
 * @param mixed  $value   Giá trị từ shortcode.
 * @param string $default Đường dẫn mặc định (đã an toàn).
 * @param bool   $allow_hash Cho phép neo "#..." (tab trỏ về cùng trang).
 */
function hv_search_local_path( $value, $default, $allow_hash = false ) {
	$value = is_string( $value ) ? trim( $value ) : '';
	if ( $allow_hash && 1 === preg_match( '/^#[A-Za-z0-9_-]*$/', $value ) ) {
		return $value;
	}
	return 1 === preg_match( '#^/[a-z0-9]+(?:[a-z0-9_-]*)(?:/[a-z0-9][a-z0-9_-]*)*$#', $value ) ? $value : $default;
}

/**
 * @param array<string,string>|string $atts Thuộc tính shortcode.
 */
function hv_search_shortcode( $atts = array() ) {
	$atts = shortcode_atts(
		array(
			'places_url'   => 'https://apigw.haivan.com/api/places?type=0',
			'results_path' => '/xe-khach/tim-chuyen',
			'airport_url'  => '/xe-san-bay',
			'contract_url' => '/dich-vu/xe-hop-dong/phuong-tien',
			'rental_url'   => '/dich-vu/xe-hop-dong/phuong-tien',
			'corridors'    => 'on', // "off" = chỉ ô tìm theo điểm đi/đến như trước.
			'today'        => 'inline', // "strip" = hàng "Chuyến hôm nay" do template in ngoài thẻ bằng hv_search_today_strip() (trang chủ).
			'tabs'         => '', // "on"/"off" ép hiện/ẩn hàng tab dịch vụ; trống = theo cài đặt Trang chủ Hải Vân.
		),
		is_array( $atts ) ? $atts : array(),
		'haivan_search'
	);

	// Đường dẫn trong shortcode chỉ được là đường dẫn nội bộ an toàn (không redirect ra ngoài site).
	$atts['results_path'] = hv_search_local_path( $atts['results_path'], '/xe-khach/tim-chuyen' );
	$atts['airport_url']  = hv_search_local_path( $atts['airport_url'], '/xe-san-bay', true );
	$atts['contract_url'] = hv_search_local_path( $atts['contract_url'], '/dich-vu/xe-hop-dong/phuong-tien', true );
	$atts['rental_url']   = hv_search_local_path( $atts['rental_url'], '/dich-vu/xe-hop-dong/phuong-tien', true );

	// Chỉ cho phép nguồn danh sách điểm là apigw của Hải Vân (chống chèn URL tuỳ ý qua shortcode).
	$places_url = esc_url_raw( $atts['places_url'], array( 'https' ) );
	if ( 0 !== strpos( $places_url, 'https://apigw.haivan.com/' ) ) {
		$places_url = 'https://apigw.haivan.com/api/places?type=0';
	}

	$lang   = hv_lang();
	$prefix = hv_lang_prefix( $lang );
	$l      = hv_search_labels( $lang );
	$cfg    = array(
		'lang'        => $lang,
		'placesUrl'   => $places_url,
		'resultsPath' => $prefix . '/' . ltrim( (string) $atts['results_path'], '/' ),
		'maxMonths'   => 4,
		'labels'      => $l,
	);

	// Chế độ tuyến chính: cần ít nhất một tuyến bật. Cùng mảng với REST booking-config, nhúng inline.
	$booking = 'off' === $atts['corridors'] ? array( 'corridors' => array() ) : hv_booking_config();
	$cmode   = ! empty( $booking['corridors'] );
	if ( $cmode ) {
		$cfg['tripsUrl'] = 'https://apigw.haivan.com/api/el/trips';
		$cfg['sc']       = hv_search_corridor_labels( $lang );
	}

	wp_enqueue_style( 'hv-search', HV_WEB_URI . '/assets/css/search.css', array( 'hv-base' ), HV_WEB_VERSION );
	wp_enqueue_script( 'hv-search', HV_WEB_URI . '/assets/js/search.js', array(), HV_WEB_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );

	static $n = 0;
	++$n;
	$uid = 'hv-search-' . $n;

	$tab = static function ( $href, $label, $icon ) use ( $prefix ) {
		$href = ( '' !== $href && '#' === $href[0] ) ? $href : $prefix . $href;
		return '<a class="hv-search__tab" href="' . esc_url( $href ) . '">' . hv_icon( $icon ) . esc_html( $label ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput -- icon là hằng số.
	};

	$arrow_swap = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></svg>';
	$t          = static fn( $key ) => hv_t( $key, $lang );
	$b_keys     = array( 'all', 'dawn', 'morning', 'noon', 'afternoon', 'evening' );
	$strip      = 'strip' === $atts['today'];
	$show_tabs  = 'on' === $atts['tabs'] || ( 'off' !== $atts['tabs'] && '1' === hv_home_settings()['show_service_tabs'] );
	$today_id   = $uid . '-today-box';

	// Hàng "Chuyến hôm nay": trong thẻ (mặc định) hoặc để template in thành dải riêng dưới banner (today="strip").
	$today_html = '';
	if ( $cmode ) {
		ob_start();
		?>
<div class="hv-search__today<?php echo $strip ? ' hv-search__today--strip' : ''; ?>" id="<?php echo esc_attr( $today_id ); ?>" role="group" aria-labelledby="<?php echo esc_attr( $uid ); ?>-today">
	<p class="hv-search__today-title" id="<?php echo esc_attr( $uid ); ?>-today"><strong><?php echo esc_html( $t( 'sc_today' ) ); ?></strong> <span class="hv-search__today-pair"></span></p>
	<div class="hv-search__chips" aria-busy="true">
		<?php foreach ( $b_keys as $k ) : ?>
		<button type="button" class="hv-search__chip" data-bucket="<?php echo esc_attr( $k ); ?>" data-label="<?php echo esc_attr( $t( 'sc_b_' . $k ) ); ?>" disabled><span><?php echo esc_html( $t( 'sc_b_' . $k ) ); ?></span><span class="hv-search__count hv-num"></span></button>
		<?php endforeach; ?>
	</div>
	<p class="hv-search__today-note" role="status" aria-live="polite"></p>
</div>
		<?php
		$today_html = (string) ob_get_clean();
		if ( $strip ) {
			$GLOBALS['hv_search_today_html'] = $today_html; // in sau bằng hv_search_today_strip().
		}
	}

	ob_start();
	?>
<div class="hv-search" id="<?php echo esc_attr( $uid ); ?>" data-hv-search="<?php echo esc_attr( wp_json_encode( $cfg ) ); ?>" data-mode="<?php echo $cmode ? 'corridor' : 'free'; ?>"<?php echo $cmode && $strip ? ' data-today="' . esc_attr( $today_id ) . '"' : ''; ?>>
	<?php if ( $show_tabs ) : // Tạm ẩn: chỉ còn xe liên tỉnh nên cả hàng tab (một tab duy nhất) bị bỏ; bật lại ở Cài đặt > Trang chủ Hải Vân. ?>
	<div class="hv-search__tabs">
		<span class="hv-search__tab is-active" aria-current="page"><?php echo hv_icon( 'bus' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $l['intercity'] ); ?></span>
		<?php
		echo $tab( $atts['airport_url'], $l['airport'], 'plane' ); // phpcs:ignore WordPress.Security.EscapeOutput -- đã escape trong closure.
		echo $tab( $atts['contract_url'], $l['contract'], 'car-front' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo $tab( $atts['rental_url'], $l['rental'], 'map' ); // phpcs:ignore WordPress.Security.EscapeOutput
		?>
	</div>
	<?php endif; ?>
	<?php if ( $cmode ) : ?>
	<script type="application/json" class="hv-search__data"><?php echo wp_json_encode( $booking, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); // phpcs:ignore WordPress.Security.EscapeOutput -- JSON thuần, đã mã hoá < > & ' ". ?></script>
	<form class="hv-search__form hv-search__form--corridor" method="get" action="<?php echo esc_url( $cfg['resultsPath'] ); ?>" novalidate>
		<div class="hv-search__routes" role="group" aria-label="<?php echo esc_attr( $t( 'sc_corridors' ) ); ?>">
			<?php foreach ( $booking['corridors'] as $i => $c ) : ?>
			<?php $c_label = $c['label'][ $lang ] ?: $c['label']['vi']; ?>
			<button type="button" class="hv-search__route" data-corridor="<?php echo esc_attr( $c['id'] ); ?>" aria-pressed="<?php echo 0 === $i ? 'true' : 'false'; ?>" aria-label="<?php echo esc_attr( $c_label ); ?>"><?php echo hv_icon( 'check', 'hv-search__tick' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span class="hv-search__route-full" aria-hidden="true"><?php echo esc_html( $c_label ); ?></span><span class="hv-search__route-two" aria-hidden="true"><span class="hv-search__route-a"><?php echo esc_html( $c['ends']['a'][ $lang ] ?: $c['ends']['a']['vi'] ); ?></span><span class="hv-search__route-b"><?php echo hv_icon( 'arrow-right', 'hv-ic--sm' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $c['ends']['b'][ $lang ] ?: $c['ends']['b']['vi'] ); ?></span></span></button>
			<?php endforeach; ?>
		</div>
		<div class="hv-search__places">
			<div class="hv-search__field">
				<label for="<?php echo esc_attr( $uid ); ?>-cfrom"><?php echo esc_html( $t( 'sc_from' ) ); ?></label>
				<span class="hv-search__control hv-search__control--select"><?php echo hv_icon( 'map-pin' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><select id="<?php echo esc_attr( $uid ); ?>-cfrom" name="diem_di"></select><?php echo hv_icon( 'chevron-down', 'hv-search__caret' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
			</div>
			<button type="button" class="hv-search__swap hv-search__swap--c" aria-label="<?php echo esc_attr( $l['swap'] ); ?>"><?php echo $arrow_swap; // phpcs:ignore WordPress.Security.EscapeOutput -- SVG hằng số. ?></button>
			<div class="hv-search__field">
				<label for="<?php echo esc_attr( $uid ); ?>-cto"><?php echo esc_html( $t( 'sc_to' ) ); ?></label>
				<span class="hv-search__control hv-search__control--select"><?php echo hv_icon( 'map-pin' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><select id="<?php echo esc_attr( $uid ); ?>-cto" name="diem_den"></select><?php echo hv_icon( 'chevron-down', 'hv-search__caret' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
			</div>
		</div>
		<div class="hv-search__when">
			<div class="hv-search__field hv-search__field--cdate">
				<label for="<?php echo esc_attr( $uid ); ?>-cdate"><?php echo esc_html( $t( 'sc_date' ) ); ?></label>
				<span class="hv-search__datebox"><input id="<?php echo esc_attr( $uid ); ?>-cdate" type="date" name="date" required><span class="hv-search__datetext" aria-hidden="true"></span></span>
			</div>
			<div class="hv-search__field hv-search__field--cret">
				<div class="hv-search__labelrow">
					<label for="<?php echo esc_attr( $uid ); ?>-cret"><?php echo esc_html( $t( 'sc_return' ) ); ?></label>
					<span class="hv-search__promo" hidden></span>
				</div>
				<button type="button" class="hv-search__addret"><?php echo hv_icon( 'plus' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $t( 'sc_add_return' ) ); ?></button>
				<span class="hv-search__retbox" hidden>
					<span class="hv-search__datebox"><input id="<?php echo esc_attr( $uid ); ?>-cret" type="date" name="ngay_ve"><span class="hv-search__datetext" aria-hidden="true"></span></span>
					<button type="button" class="hv-search__retclear" aria-label="<?php echo esc_attr( $t( 'sc_remove_return' ) ); ?>"><?php echo hv_icon( 'x' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
				</span>
			</div>
			<div class="hv-search__field hv-search__field--cguests">
				<label for="<?php echo esc_attr( $uid ); ?>-cguests"><?php echo esc_html( $t( 'sc_tickets' ) ); ?></label>
				<span class="hv-search__control hv-search__control--select">
					<select id="<?php echo esc_attr( $uid ); ?>-cguests" name="numberGuest">
						<?php for ( $tix = 1; $tix <= 9; $tix++ ) : ?>
						<option value="<?php echo (int) $tix; ?>"><?php echo esc_html( sprintf( $t( 1 === $tix ? 'sc_ticket_1' : 'sc_ticket_n' ), $tix ) ); ?></option>
						<?php endfor; ?>
					</select><?php echo hv_icon( 'chevron-down', 'hv-search__caret' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				</span>
			</div>
			<button type="submit" class="hv-btn hv-btn--lg hv-search__submit"><?php echo esc_html( $l['submit'] ); ?></button>
		</div>
		<p class="hv-search__status" role="status" aria-live="polite"></p>
		<p class="hv-search__error" role="alert" hidden></p>
		<p class="hv-search__switch"><?php echo esc_html( $t( 'sc_other_q' ) ); ?> <button type="button" class="hv-search__link" data-switch="free"><?php echo esc_html( $t( 'sc_other_link' ) ); ?></button></p>
	</form>
	<?php endif; ?>
	<form class="hv-search__form hv-search__form--free" method="get" action="<?php echo esc_url( $cfg['resultsPath'] ); ?>" novalidate<?php echo $cmode ? ' hidden' : ''; ?>>
		<div class="hv-search__field hv-search__field--from" data-field="from">
			<label for="<?php echo esc_attr( $uid ); ?>-from"><?php echo esc_html( $l['from'] ); ?></label>
			<span class="hv-search__control">
				<?php echo hv_icon( 'map-pin' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<input id="<?php echo esc_attr( $uid ); ?>-from" type="text" autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="<?php echo esc_attr( $uid ); ?>-from-list" placeholder="<?php echo esc_attr( $l['from_ph'] ); ?>">
			</span>
			<ul id="<?php echo esc_attr( $uid ); ?>-from-list" class="hv-search__list" role="listbox" hidden></ul>
		</div>
		<button type="button" class="hv-search__swap" aria-label="<?php echo esc_attr( $l['swap'] ); ?>" disabled>
			<?php echo $arrow_swap; // phpcs:ignore WordPress.Security.EscapeOutput -- SVG hằng số. ?>
		</button>
		<div class="hv-search__field hv-search__field--to" data-field="to">
			<label for="<?php echo esc_attr( $uid ); ?>-to"><?php echo esc_html( $l['to'] ); ?></label>
			<span class="hv-search__control">
				<?php echo hv_icon( 'map-pin' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<input id="<?php echo esc_attr( $uid ); ?>-to" type="text" autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="<?php echo esc_attr( $uid ); ?>-to-list" placeholder="<?php echo esc_attr( $l['to_ph'] ); ?>">
			</span>
			<ul id="<?php echo esc_attr( $uid ); ?>-to-list" class="hv-search__list" role="listbox" hidden></ul>
		</div>
		<div class="hv-search__field hv-search__field--date">
			<label for="<?php echo esc_attr( $uid ); ?>-date"><?php echo esc_html( $l['date'] ); ?></label>
			<input id="<?php echo esc_attr( $uid ); ?>-date" type="date" name="date" required>
		</div>
		<div class="hv-search__field hv-search__field--guests" role="group" aria-labelledby="<?php echo esc_attr( $uid ); ?>-guests-label">
			<label id="<?php echo esc_attr( $uid ); ?>-guests-label" for="<?php echo esc_attr( $uid ); ?>-guests"><?php echo esc_html( $l['guests'] ); ?></label>
			<div class="hv-search__counter">
				<button type="button" data-step="-1" aria-label="<?php echo esc_attr( $l['guests_dec'] ); ?>" disabled><?php echo hv_icon( 'minus' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
				<input id="<?php echo esc_attr( $uid ); ?>-guests" type="number" name="numberGuest" min="1" step="1" value="1" inputmode="numeric" required>
				<button type="button" data-step="1" aria-label="<?php echo esc_attr( $l['guests_inc'] ); ?>"><?php echo hv_icon( 'plus' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			</div>
		</div>
		<button type="submit" class="hv-btn hv-btn--lg hv-search__submit"><?php echo esc_html( $l['submit'] ); ?></button>
		<p class="hv-search__status" role="status" aria-live="polite"></p>
		<p class="hv-search__error" role="alert" hidden></p>
		<?php if ( $cmode ) : ?>
		<p class="hv-search__switch"><button type="button" class="hv-search__link" data-switch="corridor"><?php echo esc_html( $t( 'sc_back_main' ) ); ?></button></p>
		<?php endif; ?>
	</form>
	<?php echo $cmode && ! $strip ? $today_html : ''; // phpcs:ignore WordPress.Security.EscapeOutput -- dựng và escape ở trên. ?>
</div>
	<?php
	return (string) ob_get_clean();
}
add_shortcode( 'haivan_search', 'hv_search_shortcode' );


/**
 * In dải "Chuyến hôm nay" của [haivan_search today="strip"] (gọi sau shortcode, ngoài thẻ tìm vé). Không có tuyến chính
 * hoặc shortcode không chạy thì không in gì. JS nối dải với ô tìm vé qua data-today.
 *
 * @param string $aria Nhãn vùng (hv_t của ngôn ngữ hiện tại nếu để trống).
 * @return string HTML của cả khối (section nền trắng) hoặc rỗng.
 */
function hv_search_today_strip( $aria = '' ) {
	$html = (string) ( $GLOBALS['hv_search_today_html'] ?? '' );
	if ( '' === $html ) {
		return '';
	}
	$aria = '' !== $aria ? $aria : hv_t( 'sc_today' );
	return '<section class="hv-section hv-section--white hv-today" data-hv-today-section aria-label="' . esc_attr( $aria ) . '"><div class="hv-container">' . $html . '</div></section>'; // phpcs:ignore WordPress.Security.EscapeOutput -- $html dựng và escape trong hv_search_shortcode().
}
