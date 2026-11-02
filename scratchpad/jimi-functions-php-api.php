<?php
/**
 * iJaipuria Campuses Dashboard – REST API for JIMI (Indore)
 *
 * PASTE THIS ENTIRE CODE INTO YOUR theme's functions.php FILE
 * (or create a custom plugin).
 *
 * Endpoints (read-only, require X-API-User / X-API-Pass headers):
 *   GET /wp-json/ijdash/v1/students?page=1&per_page=50
 *   GET /wp-json/ijdash/v1/students/{id}
 *   GET /wp-json/ijdash/v1/summary
 *   GET /wp-json/ijdash/v1/groups?page=1&per_page=200
 *
 * IMPORTANT: Change the API credentials below before using!
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* =========================================================================
 * API CREDENTIALS – CHANGE THESE BEFORE USING
 * Send them in every request as headers: X-API-User and X-API-Pass
 * ======================================================================= */
function ijdash_api_credentials() {
	return array(
		'username' => 'ij_dashboard',
		'password' => 'CHANGE-ME-to-a-long-random-string-40+chars',
	);
}

/* =========================================================================
 * ROUTES
 * ======================================================================= */
add_action( 'rest_api_init', function () {
	$ns = 'ijdash/v1';

	// ── Students endpoints ──
	register_rest_route( $ns, '/students', array(
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'ijdash_rest_get_students',
		'permission_callback' => 'ijdash_rest_check_auth',
		'args'                => array(
			'page'              => array( 'default' => 1, 'sanitize_callback' => 'absint' ),
			'per_page'          => array( 'default' => 50, 'sanitize_callback' => 'absint' ),
			'search'            => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'role'              => array( 'default' => '', 'sanitize_callback' => 'sanitize_key' ),
			'course_id'         => array( 'default' => 0, 'sanitize_callback' => 'absint' ),
			'registered_after'  => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'registered_before' => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'include_meta'      => array( 'default' => false, 'sanitize_callback' => 'rest_sanitize_boolean' ),
		),
	) );

	register_rest_route( $ns, '/students/(?P<id>\d+)', array(
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'ijdash_rest_get_student',
		'permission_callback' => 'ijdash_rest_check_auth',
		'args'                => array(
			'id'           => array( 'sanitize_callback' => 'absint' ),
			'include_meta' => array( 'default' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ),
		),
	) );

	register_rest_route( $ns, '/summary', array(
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'ijdash_rest_get_summary',
		'permission_callback' => 'ijdash_rest_check_auth',
	) );

	// ── Groups endpoint ──
	register_rest_route( $ns, '/groups', array(
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

/* =========================================================================
 * AUTHENTICATION
 * Username + password via request headers, with lockout
 * (10 wrong attempts from one IP = blocked for 15 minutes)
 * ======================================================================= */
function ijdash_rest_check_auth( WP_REST_Request $request ) {
	$creds = ijdash_api_credentials();

	$ip       = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
	$lock_key = 'ijdash_fail_' . md5( $ip );
	$fails    = (int) get_transient( $lock_key );

	if ( $fails >= 10 ) {
		return new WP_Error( 'ijdash_locked', 'Too many failed attempts. Try again later.', array( 'status' => 429 ) );
	}

	$user = (string) $request->get_header( 'x-api-user' );
	$pass = (string) $request->get_header( 'x-api-pass' );

	$user_ok = hash_equals( $creds['username'], $user );
	$pass_ok = hash_equals( $creds['password'], $pass );

	if ( $user === '' || $pass === '' || ! $user_ok || ! $pass_ok ) {
		set_transient( $lock_key, $fails + 1, 15 * MINUTE_IN_SECONDS );
		return new WP_Error( 'ijdash_unauthorized', 'Invalid API username or password.', array( 'status' => 401 ) );
	}

	delete_transient( $lock_key );
	return true;
}

/* =========================================================================
 * HELPERS
 * ======================================================================= */
function ijdash_ts( $ts ) {
	$ts = (int) $ts;
	return $ts > 0 ? gmdate( 'c', $ts ) : null;
}

function ijdash_staff_roles() {
	return array( 'administrator', 'editor', 'author', 'contributor', 'shop_manager', 'group_leader' );
}

function ijdash_is_sensitive_meta_key( $key ) {
	global $wpdb;
	$blocked = array(
		'session_tokens',
		'_application_passwords',
		'community-events-location',
		'default_password_nag',
		$wpdb->prefix . 'capabilities',
		$wpdb->prefix . 'user_level',
		$wpdb->prefix . 'user-settings',
		$wpdb->prefix . 'user-settings-time',
		'_sfwd-quizzes',
	);
	if ( in_array( $key, $blocked, true ) ) {
		return true;
	}
	return (bool) preg_match( '/pass(word)?|token|secret|nonce|session|api_?key|otp|auth/i', $key );
}

function ijdash_activity_table() {
	global $wpdb;
	if ( class_exists( 'LDLMS_DB' ) ) {
		return LDLMS_DB::get_table_name( 'user_activity' );
	}
	return $wpdb->prefix . 'learndash_user_activity';
}

function ijdash_extract_batch_info( array $groups ) {
	foreach ( $groups as $g ) {
		if ( preg_match( '/^Batch\s+(\d{4}-\d{2,4})$/i', $g['title'], $m ) ) {
			return array(
				'batch'         => $g['title'],
				'academic_year' => $m[1],
			);
		}
	}
	return array(
		'batch'         => null,
		'academic_year' => null,
	);
}

/* =========================================================================
 * BATCHED LOOKUPS (one query per page instead of one per student)
 * ======================================================================= */
function ijdash_batch_last_learning_activity( array $ids ) {
	global $wpdb;
	if ( empty( $ids ) ) {
		return array();
	}
	$table = ijdash_activity_table();
	$in    = implode( ',', array_map( 'absint', $ids ) );

	$wpdb->suppress_errors( true );
	$rows = $wpdb->get_results(
		"SELECT user_id,
		        MAX( GREATEST( COALESCE(activity_updated,0), COALESCE(activity_started,0), COALESCE(activity_completed,0) ) ) AS last_ts
		 FROM {$table}
		 WHERE user_id IN ({$in})
		 GROUP BY user_id"
	);
	$wpdb->suppress_errors( false );

	$out = array();
	foreach ( (array) $rows as $r ) {
		$out[ (int) $r->user_id ] = (int) $r->last_ts;
	}
	return $out;
}

function ijdash_batch_xprofile( array $ids ) {
	global $wpdb;
	if ( empty( $ids ) || ! function_exists( 'bp_is_active' ) || ! bp_is_active( 'xprofile' ) ) {
		return array();
	}
	$p  = function_exists( 'bp_core_get_table_prefix' ) ? bp_core_get_table_prefix() : $wpdb->base_prefix;
	$in = implode( ',', array_map( 'absint', $ids ) );

	$rows = $wpdb->get_results(
		"SELECT d.user_id, f.name, d.value
		 FROM {$p}bp_xprofile_data d
		 INNER JOIN {$p}bp_xprofile_fields f ON f.id = d.field_id
		 WHERE d.user_id IN ({$in})"
	);

	$out = array();
	foreach ( (array) $rows as $r ) {
		$out[ (int) $r->user_id ][ $r->name ] = maybe_unserialize( $r->value );
	}
	return $out;
}

function ijdash_batch_submissions( array $ids ) {
	$out = array();
	if ( empty( $ids ) ) {
		return $out;
	}
	$posts = get_posts( array(
		'post_type'        => array( 'sfwd-assignment', 'sfwd-essays' ),
		'author__in'       => $ids,
		'post_status'      => array( 'publish', 'graded', 'not_graded', 'draft', 'pending', 'private' ),
		'posts_per_page'   => -1,
		'no_found_rows'    => true,
		'suppress_filters' => true,
	) );

	foreach ( $posts as $p ) {
		$uid = (int) $p->post_author;
		if ( 'sfwd-assignment' === $p->post_type ) {
			$out[ $uid ]['assignments'][] = array(
				'id'           => $p->ID,
				'title'        => $p->post_title,
				'course_id'    => (int) get_post_meta( $p->ID, 'course_id', true ),
				'lesson_id'    => (int) get_post_meta( $p->ID, 'lesson_id', true ),
				'approved'     => (bool) get_post_meta( $p->ID, 'approval_status', true ),
				'points'       => get_post_meta( $p->ID, 'points', true ),
				'file_url'     => get_post_meta( $p->ID, 'file_link', true ),
				'submitted_at' => ijdash_ts( strtotime( $p->post_date_gmt . ' UTC' ) ),
			);
		} else {
			$out[ $uid ]['essays'][] = array(
				'id'           => $p->ID,
				'title'        => $p->post_title,
				'status'       => $p->post_status,
				'quiz_id'      => (int) get_post_meta( $p->ID, 'quiz_id', true ),
				'course_id'    => (int) get_post_meta( $p->ID, 'course_id', true ),
				'lesson_id'    => (int) get_post_meta( $p->ID, 'lesson_id', true ),
				'submitted_at' => ijdash_ts( strtotime( $p->post_date_gmt . ' UTC' ) ),
			);
		}
	}
	return $out;
}

/* =========================================================================
 * PER-STUDENT LEARNDASH DATA
 * ======================================================================= */
function ijdash_student_courses( $uid ) {
	if ( ! function_exists( 'learndash_user_get_enrolled_courses' ) ) {
		return array();
	}
	$courses = array();
	foreach ( (array) learndash_user_get_enrolled_courses( $uid, array(), true ) as $cid ) {
		$cid      = (int) $cid;
		$progress = function_exists( 'learndash_course_progress' )
			? learndash_course_progress( array( 'user_id' => $uid, 'course_id' => $cid, 'array' => true ) )
			: array();

		$status = function_exists( 'learndash_course_status' )
			? learndash_course_status( $cid, $uid, true )
			: '';

		$completed_ts = (int) get_user_meta( $uid, 'course_completed_' . $cid, true );
		$enrolled_ts  = function_exists( 'ld_course_access_from' )
			? (int) ld_course_access_from( $cid, $uid )
			: (int) get_user_meta( $uid, 'course_' . $cid . '_access_from', true );

		$certificate = ( $completed_ts && function_exists( 'learndash_get_course_certificate_link' ) )
			? learndash_get_course_certificate_link( $cid, $uid )
			: '';

		$courses[] = array(
			'course_id'       => $cid,
			'title'           => get_the_title( $cid ),
			'url'             => get_permalink( $cid ),
			'status'          => $status,
			'completed_steps' => isset( $progress['completed'] ) ? (int) $progress['completed'] : 0,
			'total_steps'     => isset( $progress['total'] ) ? (int) $progress['total'] : 0,
			'percentage'      => isset( $progress['percentage'] ) ? (int) $progress['percentage'] : 0,
			'enrolled_at'     => ijdash_ts( $enrolled_ts ),
			'completed_at'    => ijdash_ts( $completed_ts ),
			'certificate_url' => $certificate ?: null,
		);
	}
	return $courses;
}

function ijdash_student_quizzes( $uid ) {
	$attempts = get_user_meta( $uid, '_sfwd-quizzes', true );
	$out      = array();
	foreach ( (array) $attempts as $a ) {
		if ( ! is_array( $a ) || empty( $a['quiz'] ) ) {
			continue;
		}
		$out[] = array(
			'quiz_id'            => (int) $a['quiz'],
			'quiz_title'         => get_the_title( (int) $a['quiz'] ),
			'course_id'          => isset( $a['course'] ) ? (int) $a['course'] : 0,
			'lesson_id'          => isset( $a['lesson'] ) ? (int) $a['lesson'] : 0,
			'score'              => isset( $a['score'] ) ? (int) $a['score'] : 0,
			'question_count'     => isset( $a['count'] ) ? (int) $a['count'] : 0,
			'points'             => isset( $a['points'] ) ? (float) $a['points'] : 0,
			'total_points'       => isset( $a['total_points'] ) ? (float) $a['total_points'] : 0,
			'percentage'         => isset( $a['percentage'] ) ? (float) $a['percentage'] : 0,
			'passed'             => ! empty( $a['pass'] ),
			'started_at'         => ijdash_ts( $a['started'] ?? 0 ),
			'completed_at'       => ijdash_ts( $a['completed'] ?? ( $a['time'] ?? 0 ) ),
			'time_spent_seconds' => isset( $a['timespent'] ) ? (float) $a['timespent'] : null,
		);
	}
	return $out;
}

function ijdash_student_groups( $uid ) {
	if ( ! function_exists( 'learndash_get_users_group_ids' ) ) {
		return array();
	}
	$groups = array();
	foreach ( (array) learndash_get_users_group_ids( $uid ) as $gid ) {
		$groups[] = array( 'id' => (int) $gid, 'title' => get_the_title( $gid ) );
	}
	return $groups;
}

function ijdash_student_meta( $uid ) {
	$meta = array();
	foreach ( (array) get_user_meta( $uid ) as $key => $values ) {
		if ( ijdash_is_sensitive_meta_key( $key ) ) {
			continue;
		}
		$values       = array_map( 'maybe_unserialize', (array) $values );
		$meta[ $key ] = count( $values ) === 1 ? $values[0] : $values;
	}
	return $meta;
}

function ijdash_build_student( WP_User $u, array $ctx, $include_meta ) {
	$uid     = (int) $u->ID;
	$courses = ijdash_student_courses( $uid );
	$quizzes = ijdash_student_quizzes( $uid );
	$subs    = $ctx['submissions'][ $uid ] ?? array();
	$groups  = ijdash_student_groups( $uid );

	$completed = array_filter( $courses, function ( $c ) { return 'completed' === $c['status'] || $c['completed_at']; } );
	$avg       = $courses ? round( array_sum( wp_list_pluck( $courses, 'percentage' ) ) / count( $courses ), 1 ) : 0;
	$last_site = function_exists( 'bp_get_user_last_activity' ) ? bp_get_user_last_activity( $uid ) : '';

	$batch_info = ijdash_extract_batch_info( $groups );

	$data = array(
		'id'                     => $uid,
		'username'               => $u->user_login,
		'email'                  => $u->user_email,
		'display_name'           => $u->display_name,
		'first_name'             => $u->first_name,
		'last_name'              => $u->last_name,
		'nickname'               => $u->nickname,
		'phone'                  => get_user_meta( $uid, 'billing_phone', true ) ?: null,
		'website'                => $u->user_url,
		'roles'                  => array_values( $u->roles ),
		'registered_at'          => ijdash_ts( strtotime( $u->user_registered . ' UTC' ) ),
		'last_site_activity_at'  => $last_site ? ijdash_ts( strtotime( $last_site . ' UTC' ) ) : null,
		'last_learning_activity' => ijdash_ts( $ctx['last_activity'][ $uid ] ?? 0 ),
		'avatar_url'             => get_avatar_url( $uid ),
		'profile_url'            => function_exists( 'bp_core_get_user_domain' ) ? bp_core_get_user_domain( $uid ) : null,
		'profile_fields'         => $ctx['xprofile'][ $uid ] ?? (object) array(),
		'groups'                 => $groups,
		'batch'                  => $batch_info['batch'],
		'academic_year'          => $batch_info['academic_year'],
		'stats'                  => array(
			'courses_enrolled'     => count( $courses ),
			'courses_completed'    => count( $completed ),
			'courses_in_progress'  => count( array_filter( $courses, function ( $c ) { return 'in-progress' === $c['status']; } ) ),
			'avg_progress_percent' => $avg,
			'certificates'         => count( array_filter( wp_list_pluck( $courses, 'certificate_url' ) ) ),
			'quiz_attempts'        => count( $quizzes ),
			'quizzes_passed'       => count( array_filter( wp_list_pluck( $quizzes, 'passed' ) ) ),
			'assignments'          => count( $subs['assignments'] ?? array() ),
			'essays_pending'       => count( array_filter( $subs['essays'] ?? array(), function ( $e ) { return 'not_graded' === $e['status']; } ) ),
		),
		'courses'                => $courses,
		'quizzes'                => $quizzes,
		'assignments'            => $subs['assignments'] ?? array(),
		'essays'                 => $subs['essays'] ?? array(),
	);

	if ( $include_meta ) {
		$data['meta'] = ijdash_student_meta( $uid );
	}
	return $data;
}

function ijdash_build_context( array $ids ) {
	return array(
		'last_activity' => ijdash_batch_last_learning_activity( $ids ),
		'xprofile'      => ijdash_batch_xprofile( $ids ),
		'submissions'   => ijdash_batch_submissions( $ids ),
	);
}

/* =========================================================================
 * STUDENTS ENDPOINT CALLBACKS
 * ======================================================================= */
function ijdash_rest_get_students( WP_REST_Request $request ) {
	$per_page = min( max( (int) $request['per_page'], 1 ), 200 );
	$page     = max( (int) $request['page'], 1 );

	$args = array(
		'number'      => $per_page,
		'paged'       => $page,
		'orderby'     => 'ID',
		'order'       => 'ASC',
		'count_total' => true,
		'fields'      => 'all_with_meta',
	);

	if ( $request['role'] ) {
		$args['role'] = $request['role'];
	} else {
		$args['role__not_in'] = ijdash_staff_roles();
	}

	if ( $request['search'] ) {
		$args['search']         = '*' . $request['search'] . '*';
		$args['search_columns'] = array( 'user_login', 'user_email', 'display_name', 'user_nicename' );
	}

	if ( $request['course_id'] && function_exists( 'learndash_get_users_for_course' ) ) {
		$q               = learndash_get_users_for_course( $request['course_id'], array( 'fields' => 'ID', 'number' => -1 ), false );
		$ids             = $q instanceof WP_User_Query ? array_map( 'intval', $q->get_results() ) : array();
		$args['include'] = $ids ?: array( 0 );
	}

	$date_query = array();
	if ( $request['registered_after'] ) {
		$date_query['after'] = $request['registered_after'];
	}
	if ( $request['registered_before'] ) {
		$date_query['before'] = $request['registered_before'];
	}
	if ( $date_query ) {
		$date_query['inclusive'] = true;
		$args['date_query']      = array( $date_query );
	}

	$query = new WP_User_Query( $args );
	$users = $query->get_results();
	$total = (int) $query->get_total();
	$ids   = wp_list_pluck( $users, 'ID' );
	$ctx   = ijdash_build_context( $ids );

	$students = array();
	foreach ( $users as $u ) {
		$students[] = ijdash_build_student( $u, $ctx, (bool) $request['include_meta'] );
	}

	$total_pages = (int) ceil( $total / $per_page );
	$response    = rest_ensure_response( array(
		'site'       => home_url(),
		'generated'  => gmdate( 'c' ),
		'pagination' => array(
			'page'        => $page,
			'per_page'    => $per_page,
			'total'       => $total,
			'total_pages' => $total_pages,
		),
		'students'   => $students,
	) );
	$response->header( 'X-WP-Total', $total );
	$response->header( 'X-WP-TotalPages', $total_pages );
	$response->header( 'Cache-Control', 'no-store' );
	return $response;
}

function ijdash_rest_get_student( WP_REST_Request $request ) {
	$user = get_userdata( (int) $request['id'] );
	if ( ! $user ) {
		return new WP_Error( 'ijdash_not_found', 'Student not found.', array( 'status' => 404 ) );
	}
	$ctx      = ijdash_build_context( array( $user->ID ) );
	$response = rest_ensure_response( ijdash_build_student( $user, $ctx, (bool) $request['include_meta'] ) );
	$response->header( 'Cache-Control', 'no-store' );
	return $response;
}

function ijdash_rest_get_summary( WP_REST_Request $request ) {
	$students = new WP_User_Query( array(
		'role__not_in' => ijdash_staff_roles(),
		'number'       => 1,
		'fields'       => 'ID',
		'count_total'  => true,
	) );

	$pending_assignments = new WP_Query( array(
		'post_type'      => 'sfwd-assignment',
		'post_status'    => 'publish',
		'posts_per_page' => 1,
		'fields'         => 'ids',
		'meta_query'     => array( array( 'key' => 'approval_status', 'compare' => 'NOT EXISTS' ) ),
	) );

	$courses = get_posts( array(
		'post_type'      => 'sfwd-courses',
		'post_status'    => array( 'publish', 'draft', 'private' ),
		'posts_per_page' => -1,
		'orderby'        => 'title',
		'order'          => 'ASC',
	) );

	$essays = wp_count_posts( 'sfwd-essays' );

	$response = rest_ensure_response( array(
		'site'                => home_url(),
		'generated'           => gmdate( 'c' ),
		'total_students'      => (int) $students->get_total(),
		'total_courses'       => count( $courses ),
		'assignments_pending' => (int) $pending_assignments->found_posts,
		'essays_pending'      => isset( $essays->not_graded ) ? (int) $essays->not_graded : 0,
		'courses'             => array_map( function ( $c ) {
			return array(
				'id'      => $c->ID,
				'title'   => $c->post_title,
				'status'  => $c->post_status,
				'url'     => get_permalink( $c ),
				'created' => ijdash_ts( strtotime( $c->post_date_gmt . ' UTC' ) ),
			);
		}, $courses ),
	) );
	$response->header( 'Cache-Control', 'no-store' );
	return $response;
}

/* =========================================================================
 * GROUPS ENDPOINT CALLBACK
 * Returns all groups with their courses + all_courses array (all WP courses)
 * ======================================================================= */
function ijdash_grp_get_groups( WP_REST_Request $request ) {
	$per_page = min( max( (int) $request['per_page'], 1 ), 5000 );
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

		// Student IDs
		$student_ids = array();
		if ( function_exists( 'learndash_get_groups_user_ids' ) ) {
			$student_ids = array_values( array_map( 'intval', (array) learndash_get_groups_user_ids( $gid ) ) );
		}

		// Leader IDs
		$leader_ids = array();
		if ( function_exists( 'learndash_get_groups_administrator_ids' ) ) {
			$leader_ids = array_values( array_map( 'intval', (array) learndash_get_groups_administrator_ids( $gid ) ) );
		}

		// Course IDs
		$course_ids = array();
		if ( function_exists( 'learndash_group_enrolled_courses' ) ) {
			$course_ids = array_values( array_map( 'intval', (array) learndash_group_enrolled_courses( $gid ) ) );
		}

		// Per-group courses array with id and title
		$courses = array();
		foreach ( $course_ids as $cid ) {
			$courses[] = array(
				'id'    => (int) $cid,
				'title' => get_the_title( $cid ),
			);
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
			'courses'        => $courses,
			'student_ids'    => $student_ids,
			'total_students' => count( $student_ids ),
			'total_courses'  => count( $course_ids ),
		);
	}

	// ── All courses from WordPress (all published sfwd-courses) ──
	$all_courses  = array();
	$course_query = new WP_Query( array(
		'post_type'      => 'sfwd-courses',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'orderby'        => 'title',
		'order'          => 'ASC',
		'fields'         => 'ids',
	) );
	foreach ( $course_query->posts as $cid ) {
		$all_courses[] = array(
			'id'    => (int) $cid,
			'title' => get_the_title( $cid ),
		);
	}

	$total       = (int) $query->found_posts;
	$total_pages = $per_page > 0 ? (int) ceil( $total / $per_page ) : 1;

	return rest_ensure_response( array(
		'site'        => home_url(),
		'generated'   => gmdate( 'c' ),
		'pagination'  => array(
			'page'        => $page,
			'per_page'    => $per_page,
			'total'       => $total,
			'total_pages' => $total_pages,
		),
		'groups'      => $groups,
		'all_courses' => $all_courses,
	) );
}
