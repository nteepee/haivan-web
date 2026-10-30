<?php
/**
 * Xe hợp đồng (/dich-vu/xe-hop-dong) v2: Nhu cầu → Tâm và Hành → Giá tham khảo → Form báo giá qua Zalo → Cách đặt.
 * Mục tiêu: đẩy lead về Zalo (hv2_zalo_lead; khu vực Bắc/Nam chọn đúng OA). Chữ sửa trong hộp "Nội dung trang (v2)".
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
the_post();
$hv2_en = 'en' === hv_lang();
list( $hv2_hot, $hv2_tel ) = hv2_hotline();
hv2_story_top( '<p class="hv-actions hv2-actions"><a class="hv2-btn" href="#hv2-lead">' . esc_html( hv2_s( 'cta' ) ) . '</a><a class="hv2-textlink" href="' . esc_url( $hv2_tel ) . '">' . esc_html( $hv2_hot ) . '<span aria-hidden="true">↗</span></a></p>' );
?>

<section class="hv2-sec" aria-labelledby="hv2-nd">
	<div class="hv2-wrap">
		<?php hv2_head( '', 'hv2-nd', hv2_s( 'nd_eyebrow' ), hv2_s( 'nd_h2_a' ), hv2_s( 'nd_h2_b' ) ); ?>
		<ul class="hv2-cards3">
			<?php foreach ( hv2_s_lines( 'nd_items' ) as $hv2_c ) : ?>
				<li class="hv2-card">
					<span class="hv2-card-img"><?php echo hv2_story_img( $hv2_c[2] ?? '', $hv2_c[0] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
					<div class="hv2-card-body"><h3><?php echo esc_html( $hv2_c[0] ); ?></h3><p><?php echo esc_html( $hv2_c[1] ?? '' ); ?></p></div>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-th">
	<div class="hv2-wrap">
		<?php hv2_head( '', 'hv2-th', hv2_s( 'th_eyebrow' ), hv2_s( 'th_h2_a' ), hv2_s( 'th_h2_b' ) ); ?>
		<?php hv2_story_pairs( 'th_rows', hv2_s( 'th_h2_a' ), hv2_s( 'th_h2_b' ) ); ?>
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
		hv2_zalo_lead(
			'hv2-lead-hd',
			array(
				array( 'key' => 'region', 'label' => $hv2_en ? 'Area' : 'Khu vực', 'type' => 'chips', 'options' => array( array( $hv2_en ? 'South (Saigon, Vung Tau)' : 'Miền Nam (Sài Gòn, Vũng Tàu)', 'nam' ), array( $hv2_en ? 'North (Hanoi, northwest)' : 'Miền Bắc (Hà Nội, Tây Bắc)', 'bac' ) ) ),
				array( 'key' => 'trip', 'label' => $hv2_en ? 'Trip' : 'Hành trình', 'type' => 'chips', 'options' => array( array( $hv2_en ? 'One way' : 'Một chiều' ), array( $hv2_en ? 'Same-day return' : 'Khứ hồi trong ngày' ), array( $hv2_en ? 'Several days' : 'Nhiều ngày' ) ) ),
				array( 'key' => 'car', 'label' => $hv2_en ? 'Vehicle' : 'Loại xe', 'type' => 'select', 'options' => array( array( $hv2_en ? 'Not sure, please advise' : 'Chưa rõ, nhờ tư vấn' ), array( $hv2_en ? '7 seats' : 'Xe 7 chỗ' ), array( $hv2_en ? 'Limousine 9–11 seats' : 'Limousine 9–11 chỗ' ), array( $hv2_en ? '16–29 seats' : 'Xe 16–29 chỗ' ), array( $hv2_en ? '45 seats' : 'Xe 45 chỗ' ) ) ),
				array( 'key' => 'people', 'label' => $hv2_en ? 'People' : 'Số người', 'type' => 'number', 'placeholder' => '4' ),
				array( 'key' => 'from', 'label' => $hv2_en ? 'Pick-up' : 'Điểm đón', 'type' => 'text', 'placeholder' => $hv2_en ? 'Address, hotel, airport…' : 'Địa chỉ, khách sạn, sân bay…' ),
				array( 'key' => 'to', 'label' => $hv2_en ? 'Destination' : 'Điểm đến', 'type' => 'text', 'placeholder' => $hv2_en ? 'e.g. Vung Tau' : 'Ví dụ: Vũng Tàu' ),
				array( 'key' => 'date', 'label' => $hv2_en ? 'Date' : 'Ngày đi', 'type' => 'date' ),
				array( 'key' => 'phone', 'label' => $hv2_en ? 'Your phone' : 'Số điện thoại của bạn', 'type' => 'tel', 'placeholder' => '09xx xxx xxx', 'required' => true ),
			),
			array(
				'prefix' => $hv2_en ? 'Hello Hai Van, I would like a quote for private hire:' : 'Chào Hải Vân, mình cần báo giá thuê xe hợp đồng:',
				'submit' => hv2_s( 'cta' ),
				'note'   => hv2_s( 'ld_note' ),
				'copied' => hv2_s( 'ld_copied' ),
				'zalo'   => 'nam',
			)
		);
		?>
	</div>
</section>

<section class="hv2-sec hv2-sec--tint" aria-labelledby="hv2-how">
	<div class="hv2-wrap">
		<?php hv2_head( '', 'hv2-how', hv2_s( 'how_eyebrow' ), hv2_s( 'how_h2_a' ), hv2_s( 'how_h2_b' ) ); ?>
		<?php hv2_story_howto( 'how_steps' ); ?>
	</div>
</section>
<?php
get_footer();
