// ── Groups API (fast) ───────────────────────────────────────────────
// Paste in functions.php AFTER the main students API code.
// Returns groups with student_ids array only – use /students API for details.

add_action( 'rest_api_init', function () {
	register_rest_route( 'ijdash/v1', '/groups', array(
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'ijdash_grp_get_groups',
		'permission_callback' => 'ijdash_rest_check_auth',
		'args'                => array(
			'page'     => array( 'default' => 1, 'sanitize_callback' => 'absint' ),
			'per_page' => array( 'default' => 200, 'sanitize_callback' => 'absint' ),
			'search'   => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
		),
	) );
} );

function ijdash_grp_get_groups( WP_REST_Request $request ) {
	$per_page = min( max( (int) $request['per_page'], 1 ), 200 );
	$page     = max( (int) $request['page'], 1 );

	$args = array(
		'post_type'      => 'groups',
		'post_status'    => 'any',
		'posts_per_page' => $per_page,
		'paged'          => $page,
		'orderby'        => 'title',
		'order'          => 'ASC',
	);

	if ( $request['search'] ) {
		$args['s'] = $request['search'];
	}

	$query  = new WP_Query( $args );
	$groups = array();

	foreach ( $query->posts as $p ) {
		$gid = (int) $p->ID;

		// Student IDs only
		$student_ids = array();
		if ( function_exists( 'learndash_get_groups_user_ids' ) ) {
			$student_ids = array_values( array_map( 'intval', (array) learndash_get_groups_user_ids( $gid ) ) );
		}

		// Leader IDs only
		$leader_ids = array();
		if ( function_exists( 'learndash_get_groups_administrator_ids' ) ) {
			$leader_ids = array_values( array_map( 'intval', (array) learndash_get_groups_administrator_ids( $gid ) ) );
		}

		// Course IDs only
		$course_ids = array();
		if ( function_exists( 'learndash_group_enrolled_courses' ) ) {
			$course_ids = array_values( array_map( 'intval', (array) learndash_group_enrolled_courses( $gid ) ) );
		}

		// Batch from title
		$batch         = null;
		$academic_year = null;
		if ( preg_match( '/Batch\s+(\d{4}-\d{2,4})/i', $p->post_title, $m ) ) {
			$batch         = trim( $m[0] );
			$academic_year = $m[1];
		}

		$created = strtotime( $p->post_date_gmt . ' UTC' );

		$groups[] = array(
			'id'             => $gid,
			'title'          => $p->post_title,
			'status'         => $p->post_status,
			'created_at'     => $created > 0 ? gmdate( 'c', $created ) : null,
			'batch'          => $batch,
			'academic_year'  => $academic_year,
			'leader_ids'     => $leader_ids,
			'course_ids'     => $course_ids,
			'student_ids'    => $student_ids,
			'total_students' => count( $student_ids ),
			'total_courses'  => count( $course_ids ),
		);
	}

	$total       = (int) $query->found_posts;
	$total_pages = $per_page > 0 ? (int) ceil( $total / $per_page ) : 1;

	return rest_ensure_response( array(
		'site'       => home_url(),
		'generated'  => gmdate( 'c' ),
		'pagination' => array(
			'page'        => $page,
			'per_page'    => $per_page,
			'total'       => $total,
			'total_pages' => $total_pages,
		),
		'groups' => $groups,
	) );
}
