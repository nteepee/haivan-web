<?php
/**
 * wp eval-file /scripts/content-bridge.php   (dry-run mặc định; HV_APPLY=1 để ghi; HV_BRIDGE_REBUILD=1 dựng lại hộp đã có)
 *
 * Hộp "bắc cầu ngữ nghĩa" về các tuyến còn khai thác, cho bài của điểm đến đã ngưng (audit mục 4.2):
 *   north    mẫu 1: Hà Giang, Sa Pa, Lào Cai, Tuyên Quang, Hạ Long, Ninh Bình  -> 3 tuyến Tây Bắc từ Hà Nội
 *   south    mẫu 2: Huế, Đà Lạt, Nha Trang, Đà Nẵng, Hội An                    -> Sài Gòn - Vũng Tàu và Tây Bắc
 *   hospital mẫu 3: bài bệnh viện/y tế trong /diem-den/ha-noi                   -> đưa đón bệnh nhân từ Tây Bắc
 * HTML tĩnh, không emoji, không mũi tên; chỉ link tuyến còn sống (hv_route + 4 landing tuyến chính). Kiểu và nội dung hộp:
 *   <!-- hv-seo-bridge:north -->
 *   <div class="hv-seo-bridge" data-hv-bridge="north"><p>...</p><ul><li>...</li></ul></div>
 * Chèn sau đoạn </p> thứ hai (hoặc cuối bài, trước các shortcode [haivan_cta] cuối nếu bài ngắn). Bài đã có dấu hv-seo-bridge thì bỏ qua.
 * Hộp thay khối gợi ý giữa bài (<p class="hv-context-link">) của chính các bài này để không bắc cầu hai lần.
 * Phân loại bài theo lib/relink-map.csv (cụm + chủ đề); bài ngoài CSV phân theo đường dẫn /diem-den/<điểm>/ và tiêu đề.
 * Idempotent.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}
require_once __DIR__ . '/lib/content-links.php';

$run     = new HVC_Run( 'content-bridge' );
$rebuild = '1' === (string) ( getenv( 'HV_BRIDGE_REBUILD' ) ?: '0' );
$csv     = hvl_csv();

/** Liên kết tuyến, bỏ qua tuyến chưa sống. */
$link = static function ( $path, $text ) {
	return hvl_route_live( $path ) ? hvl_a( $path, $text ) : null;
};
/** Nối các phần tử có giá trị bằng dấu phẩy, "và" ở cuối. */
$join = static function ( array $items ) {
	$items = array_values( array_filter( $items ) );
	if ( count( $items ) > 1 ) {
		$last = array_pop( $items );
		return implode( ', ', $items ) . ' và ' . $last;
	}
	return implode( '', $items );
};

$box = static function ( $type ) use ( $link, $join ) {
	$brand = '<a href="/"><strong>Hãng xe Hải Vân</strong></a>';
	$mc    = $join( array( $link( '/xe-khach/my-dinh/moc-chau', 'Xe đi Hà Nội – Mộc Châu (Mỹ Đình – Mộc Châu)' ) ) );
	$mc_b  = $link( '/xe-khach/moc-chau/my-dinh', 'Xe Mộc Châu về Hà Nội' );
	$sl    = $link( '/xe-khach/my-dinh/son-la', 'Xe giường nằm Hà Nội đi TP. Sơn La' );
	$sl_b  = $link( '/xe-khach/son-la/my-dinh', 'Xe Sơn La về Hà Nội' );
	$db    = $link( '/xe-khach/my-dinh/dien-bien', 'Xe khách Hà Nội – Điện Biên (Bến xe Mỹ Đình)' );
	$db_y  = $link( '/xe-khach/yen-nghia/dien-bien', 'Xe Yên Nghĩa đi Điện Biên' );
	$db_b  = $link( '/xe-khach/dien-bien/my-dinh', 'Xe Điện Biên về Hà Nội' );
	$vt    = $link( '/xe-khach/quan-1/vung-tau', 'Xe đi Vũng Tàu từ Quận 1 Sài Gòn' );
	$vt_a  = $link( '/xe-khach/tan-son-nhat/vung-tau', 'Xe limousine Sân bay Tân Sơn Nhất đi Vũng Tàu' );
	$vt_b  = $link( '/xe-khach/vung-tau/quan-1-san-bay', 'Xe Vũng Tàu đi Sài Gòn – Sân bay Tân Sơn Nhất' );
	$li    = static fn( $label, $body ) => '' === trim( (string) $body ) ? '' : "<li>$label $body</li>\n";

	if ( 'north' === $type ) {
		$body = "<p><strong>Gợi ý hành trình Tây Bắc cùng Hãng xe Hải Vân:</strong> Bên cạnh các điểm đến vùng cao phía Bắc, nếu bạn khởi hành từ <strong>Hà Nội (Bến xe Mỹ Đình, Yên Nghĩa)</strong>, $brand hiện khai thác dòng xe Cabin giường nằm Hoàng Gia (Royal) &amp; Limousine VIP trên các tuyến Tây Bắc trọng điểm:</p>\n<ul>\n"
			. $li( 'Tuyến cao nguyên:', trim( $mc . ( $mc_b ? ' và chiều về ' . $mc_b : '' ) ) . '.' )
			. $li( 'Tuyến trung tâm Tây Bắc:', trim( $sl . ( $sl_b ? ' và chiều về ' . $sl_b : '' ) ) . ' (đón trả tận nơi tại TP. Sơn La).' )
			. $li( 'Tuyến lịch sử:', $join( array( $db, $db_y, $db_b ) ) . ' (phòng chờ miễn phí và xe trung chuyển tới 9 bệnh viện lớn tại Hà Nội).' )
			. '</ul>';
	} elseif ( 'south' === $type ) {
		$body = "<p><strong>Đồng hành cùng Hãng xe Hải Vân trên các cung đường chủ lực:</strong> Là thương hiệu vận tải hành khách và hàng hóa, $brand hiện phục vụ hành khách tại cả hai miền Nam – Bắc:</p>\n<ul>\n"
			. $li( '<strong>Phía Nam (Sài Gòn – Vũng Tàu):</strong> Đặt vé', $join( array( $vt, $vt_a ) ) . ( $vt_b ? ' và chiều ngược lại ' . $vt_b : '' ) . '.' )
			. $li( '<strong>Phía Bắc (Hà Nội – Tây Bắc):</strong> Đặt vé', $join( array( $link( '/xe-khach/my-dinh/moc-chau', 'Xe đi Hà Nội – Mộc Châu' ), $link( '/xe-khach/my-dinh/son-la', 'Xe đi Sơn La' ), $link( '/xe-khach/my-dinh/dien-bien', 'Xe giường nằm Hà Nội – Điện Biên' ) ) ) . '.' )
			. '</ul>';
	} else { // hospital
		$routes = $join( array( $link( '/xe-khach/dien-bien/my-dinh', 'Xe Điện Biên về Hà Nội (Mỹ Đình)' ), $link( '/xe-khach/my-dinh/dien-bien', 'Xe giường nằm Hà Nội – Điện Biên' ), $link( '/xe-khach/son-la/my-dinh', 'Xe Sơn La về Hà Nội' ), $link( '/xe-khach/moc-chau/my-dinh', 'Xe Mộc Châu về Hà Nội' ) ) );
		$body   = "<p><strong>Hỗ trợ đưa đón miễn phí tới các bệnh viện lớn tại Hà Nội:</strong> Hành khách từ các tỉnh Tây Bắc đi khám chữa bệnh tại Hà Nội khi đặt vé $brand trên các tuyến $routes sẽ được <strong>xe trung chuyển Hải Vân đưa đón miễn phí</strong> từ Phòng chờ Bến xe Mỹ Đình tới cổng bệnh viện.</p>";
	}
	return "<!-- hv-seo-bridge:$type -->\n<div class=\"hv-seo-bridge\" data-hv-bridge=\"$type\">\n$body\n</div>";
};

/** Chèn sau </p> thứ hai; bài ngắn hơn thì chèn cuối (trước shortcode [haivan_cta] cuối). */
$insert = static function ( $html, $block ) {
	if ( preg_match_all( '#</p>#i', $html, $m, PREG_OFFSET_CAPTURE ) && count( $m[0] ) >= 2 ) {
		$end = $m[0][1][1] + 4;
		return substr( $html, 0, $end ) . "\r\n\r\n" . $block . substr( $html, $end );
	}
	if ( preg_match( '#(\s*(?:\[haivan_cta[^\]]*\]\s*)+)$#', $html, $t, PREG_OFFSET_CAPTURE ) ) {
		return substr( $html, 0, $t[0][1] ) . "\r\n\r\n" . $block . $t[0][0];
	}
	return rtrim( $html ) . "\r\n\r\n" . $block;
};

$per_type = array( 'north' => 0, 'south' => 0, 'hospital' => 0 );
foreach ( $run->posts( array( 'bai_viet', 'tin_tuc' ), array( 'publish' ) ) as $row ) {
	$id   = (int) $row->ID;
	$c    = $csv[ strtolower( hvc_post_path( $id ) ) ] ?? null;
	$type = hvl_bridge_type( $row, $c );
	if ( '' === $type ) {
		continue;
	}
	$content = $row->post_content;
	$has     = false !== strpos( $content, 'hv-seo-bridge' );
	if ( $has && ! $rebuild ) {
		// Hộp đã có: chỉ dọn khối gợi ý giữa bài còn sót (nếu relink chạy sau).
		$content = preg_replace( '#\s*<p class="hv-context-link">.*?</p>#s', '', $content, -1, $n );
		if ( $n ) {
			$run->hit( 'bo-context-link-thua', $id, $n );
		}
		$run->commit( $row, array( 'post_content' => $content ) );
		continue;
	}
	if ( $has ) {
		$content = preg_replace( '#<!-- hv-seo-bridge:[a-z]+ -->\s*<div class="hv-seo-bridge".*?</div>\s*#s', '', $content );
	}
	$content = preg_replace( '#\s*<p class="hv-context-link">.*?</p>#s', '', $content, -1, $n );
	if ( $n ) {
		$run->hit( 'thay-context-link', $id, $n );
	}
	$content = $insert( $content, $box( $type ) );
	$run->hit( 'hop-bac-cau-' . $type, $id );
	++$per_type[ $type ];
	$run->sample( 'hop-bac-cau-' . $type, $id, $row->post_content, $content );
	$run->commit( $row, array( 'post_content' => $content ) );
}

$run->finish();
