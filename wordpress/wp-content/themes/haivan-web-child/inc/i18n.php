<?php
/**
 * Ngôn ngữ (vi mặc định, en dưới /en/) và chuỗi giao diện cố định.
 * Nhãn lấy từ docs/reference/locales/{vi,en}/common.json của web cũ.
 *
 * @package HaiVanWeb
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Mã ngôn ngữ hiện tại: 'vi' | 'en'. Hoạt động cả khi Polylang chưa bật.
 */
function hv_lang() {
	if ( function_exists( 'pll_current_language' ) ) {
		$slug = pll_current_language( 'slug' );
		if ( is_string( $slug ) && '' !== $slug ) {
			return 'en' === $slug ? 'en' : 'vi';
		}
	}
	return 0 === strpos( determine_locale(), 'en' ) ? 'en' : 'vi';
}

/**
 * Tiền tố URL: '' cho vi, '/en' cho en.
 */
function hv_lang_prefix( $lang = null ) {
	$lang = $lang ? $lang : hv_lang();
	return 'en' === $lang ? '/en' : '';
}

/**
 * Chuỗi giao diện theo ngôn ngữ.
 */
function hv_t( $key, $lang = null ) {
	static $strings = null;
	if ( null === $strings ) {
		$strings = array(
			'vi' => array(
				'login'            => 'Đăng nhập',
				'account'          => 'Tài khoản',
				'personal_infor'   => 'Thông tin cá nhân',
				'my_offer'         => 'Ưu đãi của tôi',
				'my_trip'          => 'Chuyến đi của tôi',
				'logout'           => 'Đăng xuất',
				'logout_failed'    => 'Không đăng xuất được, vui lòng thử lại.',
				'home_aria'        => 'Hải Vân - Trang chủ',
				'menu'             => 'Menu',
				'language'         => 'Đổi ngôn ngữ',
				'download_app'     => 'Tải ứng dụng đặt xe Hải Vân với vô vàn tính năng',
				'intro1'           => 'Theo dõi lộ trình & vị trí xe',
				'intro2'           => 'Không sợ mất vé',
				'intro3'           => 'Tích điểm đổi vé & Khuyến mãi liên tục',
				'intro4'           => 'Khách hàng thân thiết',
				'popular_routes'   => 'Tuyến phổ biến',
				'book_route'       => 'Đặt vé',
				'hero_title'       => 'Đặt vé xe khách Hải Vân',
				'hero_sub'         => 'Xe limousine & xe giường nằm chất lượng cao, đón trả tận nơi trên toàn quốc.',
				'not_found_title'  => 'Không tìm thấy trang',
				'not_found_text'   => 'Trang bạn tìm không tồn tại hoặc đã được chuyển.',
				'back_home'        => 'Về trang chủ',
				'read_more'        => 'Xem thêm',
				'published'        => 'Đăng ngày',
				'destinations'     => 'Điểm đến',
				'news'             => 'Tin tức',
				'skip'             => 'Bỏ qua, tới nội dung',
				'home'             => 'Trang chủ',
				'explore'          => 'Khám phá',
				'about_us'         => 'Chúng tôi',
				'latest_posts'     => 'Bài viết mới nhất',
				'related_posts'    => 'Bài viết liên quan',
				'destination_title' => 'Kinh nghiệm du lịch %s',
				'tags'             => 'Tag',
				'pagination'       => 'Phân trang',
				'no_posts'         => 'Chưa có bài viết cho điểm đến này.',
			),
			'en' => array(
				'login'            => 'Log in',
				'account'          => 'Account',
				'personal_infor'   => 'Profile',
				'my_offer'         => 'My offer',
				'my_trip'          => 'My trips',
				'logout'           => 'Log out',
				'logout_failed'    => 'Could not log out, please try again.',
				'home_aria'        => 'Hai Van - Home',
				'menu'             => 'Menu',
				'language'         => 'Change language',
				'download_app'     => 'Download Haivan App and enjoy your trip',
				'intro1'           => 'Track route and car location',
				'intro2'           => 'No worry for paper ticket lost',
				'intro3'           => 'Accumulate points to redeem tickets & Continuous promotions',
				'intro4'           => 'Loyalty Customers',
				'popular_routes'   => 'Popular routes',
				'book_route'       => 'Book',
				'hero_title'       => 'Book Hai Van coach tickets',
				'hero_sub'         => 'Premium limousine and sleeper coaches with door-to-door pick-up across Vietnam.',
				'not_found_title'  => 'Page not found',
				'not_found_text'   => 'The page you are looking for does not exist or has moved.',
				'back_home'        => 'Back to home',
				'read_more'        => 'Read more',
				'published'        => 'Published',
				'destinations'     => 'Destinations',
				'news'             => 'News',
				'skip'             => 'Skip to content',
				'home'             => 'Home',
				'explore'          => 'Explore',
				'about_us'         => 'About us',
				'latest_posts'     => 'Latest posts',
				'related_posts'    => 'Related posts',
				'destination_title' => 'Travel tips for %s',
				'tags'             => 'Tags',
				'pagination'       => 'Pagination',
				'no_posts'         => 'No posts for this destination yet.',
			),
		);
	}
	if ( ! isset( $strings['_merged'] ) ) {
		$strings            = array_replace_recursive( $strings, hv_labels_extra() );
		$strings['_merged'] = array();
	}
	$lang = $lang ? $lang : hv_lang();
	return $strings[ $lang ][ $key ] ?? ( $strings['vi'][ $key ] ?? $key );
}
