<?php
/**
 * Gửi hàng (/dich-vu/hang-hoa) v2: Bốn tuyến (Vũng Tàu, Điện Biên, Mộc Châu, Sơn La) → Tâm và Hành → Cước → Form báo
 * cước qua Zalo (tuyến Tây Bắc mở OA Hải Vân Xuân Tráng, Vũng Tàu mở OA Hải Vân) → Cách gửi. Chữ sửa trong hộp
 * "Nội dung trang (v2)"; số liệu lấy từ trang gửi hàng đang chạy trên booking.haivan.com.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
the_post();
$hv2_en   = 'en' === hv_lang();
$hv2_p    = hv_lang_prefix();
$hv2_zalo = hv2_zalo_urls();
list( $hv2_hot, $hv2_tel ) = hv2_hotline();
$hv2_routes = hv2_s_lines( 'rt_items' );
hv2_story_top( '<p class="hv-actions hv2-actions"><a class="hv2-btn" href="#hv2-lead">' . esc_html( hv2_s( 'cta' ) ) . '</a><a class="hv2-textlink" href="' . esc_url( $hv2_p . '/dich-vu/hang-hoa/tra-cuu-don' ) . '">' . esc_html( hv2_s( 'track' ) ) . '<span aria-hidden="true">↗</span></a></p>' );
?>

<section class="hv2-sec" aria-labelledby="hv2-rt">
	<div class="hv2-wrap">
		<?php hv2_head( '', 'hv2-rt', hv2_s( 'rt_eyebrow' ), hv2_s( 'rt_h2_a' ), hv2_s( 'rt_h2_b' ) ); ?>
		<ul class="hv2-cards3 hv2-cards4">
			<?php foreach ( $hv2_routes as $hv2_r ) : ?>
				<?php $hv2_url = $hv2_zalo[ 'bac' === ( $hv2_r[4] ?? '' ) ? 'bac' : 'nam' ]; ?>
				<li class="hv2-card hv2-ship-card">
					<span class="hv2-card-img"><?php echo hv2_story_img( $hv2_r[3] ?? '', $hv2_r[0] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
					<div class="hv2-card-body">
						<h3><?php echo esc_html( $hv2_r[0] ); ?></h3>
						<p><?php echo esc_html( $hv2_r[1] ?? '' ); ?></p>
						<p class="hv2-ship-at"><strong><?php echo esc_html( hv2_s( 'rt_send' ) ); ?>:</strong> <?php echo esc_html( $hv2_r[2] ?? '' ); ?></p>
						<a class="hv2-more" href="<?php echo esc_url( $hv2_url ); ?>" target="_blank" rel="noopener"><?php echo esc_html( hv2_s( 'rt_go' ) ); ?><span aria-hidden="true">↗</span></a>
					</div>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-th">
	<div class="hv2-wrap hv2-split">
		<div>
			<?php hv2_head( '', 'hv2-th', hv2_s( 'th_eyebrow' ), hv2_s( 'th_h2_a' ), hv2_s( 'th_h2_b' ) ); ?>
			<?php hv2_story_pairs( 'th_rows', $hv2_en ? 'Our promise' : 'Điều chúng tôi giữ', $hv2_en ? 'What we do' : 'Việc chúng tôi làm' ); ?>
		</div>
		<figure class="hv2-split-photo"><?php echo hv2_img_tag( 'gh-loading.webp', $hv2_en ? 'Hai Van staff loading parcels onto a coach' : 'Nhân viên Hải Vân xếp hàng lên xe' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></figure>
	</div>
</section>

<section class="hv2-sec hv2-sec--dark" aria-labelledby="hv2-pr">
	<div class="hv2-wrap">
		<?php hv2_head( '', 'hv2-pr', hv2_s( 'pr_eyebrow' ), hv2_s( 'pr_h2_a' ), hv2_s( 'pr_h2_b' ), hv2_link( '#hv2-lead', hv2_s( 'cta' ) ) ); ?>
		<?php hv2_story_prices( 'pr_items', 'pr_note' ); ?>
	</div>
</section>

<section class="hv2-sec" id="hv2-lead" aria-labelledby="hv2-ld">
	<div class="hv2-wrap hv2-lead-wrap">
		<?php hv2_head( '', 'hv2-ld', hv2_s( 'ld_eyebrow' ), hv2_s( 'ld_h2_a' ), hv2_s( 'ld_h2_b' ), '<p class="hv2-intro">' . esc_html( hv2_s( 'ld_intro' ) ) . '</p>' ); ?>
		<?php
		$hv2_route_opts = array();
		foreach ( $hv2_routes as $hv2_r ) {
			$hv2_route_opts[] = array( $hv2_r[0], 'bac' === ( $hv2_r[4] ?? '' ) ? 'bac' : 'nam' );
		}
		hv2_zalo_lead(
			'hv2-lead-gh',
			array(
				array( 'key' => 'route', 'label' => $hv2_en ? 'Route' : 'Tuyến', 'type' => 'chips', 'options' => $hv2_route_opts ),
				array( 'key' => 'dir', 'label' => $hv2_en ? 'Direction' : 'Chiều gửi', 'type' => 'chips', 'options' => array( array( $hv2_en ? 'From Hanoi / Saigon' : 'Từ Hà Nội / Sài Gòn đi' ), array( $hv2_en ? 'To Hanoi / Saigon' : 'Gửi về Hà Nội / Sài Gòn' ) ) ),
				array( 'key' => 'kind', 'label' => $hv2_en ? 'Parcel type' : 'Loại hàng', 'type' => 'select', 'options' => array( array( $hv2_en ? 'Documents' : 'Tài liệu, hồ sơ' ), array( $hv2_en ? 'Small parcel' : 'Kiện nhỏ' ), array( $hv2_en ? 'Foam box, food' : 'Thùng xốp, thực phẩm' ), array( $hv2_en ? 'Bulky goods' : 'Hàng cồng kềnh' ), array( $hv2_en ? 'Other' : 'Khác' ) ) ),
				array( 'key' => 'weight', 'label' => $hv2_en ? 'Approx. weight / size' : 'Khối lượng, kích thước', 'type' => 'text', 'placeholder' => $hv2_en ? 'e.g. 2 boxes, 15 kg' : 'Ví dụ: 2 thùng, 15 kg' ),
				array( 'key' => 'date', 'label' => $hv2_en ? 'Sending date' : 'Ngày gửi', 'type' => 'date' ),
				array( 'key' => 'phone', 'label' => $hv2_en ? 'Your phone' : 'Số điện thoại của bạn', 'type' => 'tel', 'placeholder' => '09xx xxx xxx', 'required' => true ),
			),
			array(
				'prefix' => $hv2_en ? 'Hello Hai Van, I would like to send a parcel:' : 'Chào Hải Vân, mình cần gửi hàng:',
				'submit' => hv2_s( 'cta' ),
				'note'   => hv2_s( 'ld_note' ),
				'copied' => hv2_s( 'ld_copied' ),
				'zalo'   => $hv2_route_opts ? $hv2_route_opts[0][1] : 'nam',
			)
		);
		?>
	</div>
</section>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-how">
	<div class="hv2-wrap">
		<?php hv2_head( '', 'hv2-how', hv2_s( 'how_eyebrow' ), hv2_s( 'how_h2_a' ), hv2_s( 'how_h2_b' ) ); ?>
		<?php hv2_story_howto( 'how_steps' ); ?>
		<p class="hv2-biz"><?php echo esc_html( hv2_s( 'biz_text' ) ); ?></p>
	</div>
</section>
<?php
get_footer();
