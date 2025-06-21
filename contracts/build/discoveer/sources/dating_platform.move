module discoveer::dating_platform {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use std::vector;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use std::option::{Self, Option};

    // Error codes
    const E_ALREADY_REGISTERED: u64 = 1;
    const E_NOT_REGISTERED: u64 = 2;
    const E_ALREADY_SWIPED: u64 = 3;
    const E_CANNOT_SWIPE_SELF: u64 = 4;
    const E_NOT_MATCHED: u64 = 5;
    const E_PROFILE_NOT_FOUND: u64 = 6;

    // Structs
    struct UserRegistry has key {
        id: UID,
        users: Table<address, ID>, // Maps user address to their profile ID
        total_users: u64,
    }

    struct UserProfile has key, store {
        id: UID,
        owner: address,
        name: String,
        bio: String,
        age: u8,
        profile_images: vector<String>, // URLs to profile images
        location: String,
        interests: vector<String>,
        is_active: bool,
        created_at: u64,
        last_active: u64,
    }

    struct SwipeRecord has key {
        id: UID,
        swiper: address,
        swiped: address,
        is_like: bool, // true for right swipe, false for left swipe
        timestamp: u64,
    }

    struct Match has key, store {
        id: UID,
        user1: address,
        user2: address,
        matched_at: u64,
        is_active: bool,
        chat_enabled: bool,
    }

    struct MatchRegistry has key {
        id: UID,
        matches: Table<address, vector<ID>>, // Maps user to their match IDs
        swipes: Table<address, Table<address, bool>>, // Nested table: swiper -> swiped -> is_like
    }

    struct CallSession has key, store {
        id: UID,
        caller: address,
        callee: address,
        session_type: u8, // 0 for audio, 1 for video
        started_at: u64,
        ended_at: Option<u64>,
        is_active: bool,
    }

    // Events
    struct UserRegistered has copy, drop {
        user: address,
        profile_id: ID,
        timestamp: u64,
    }

    struct SwipeEvent has copy, drop {
        swiper: address,
        swiped: address,
        is_like: bool,
        timestamp: u64,
    }

    struct MatchCreated has copy, drop {
        user1: address,
        user2: address,
        match_id: ID,
        timestamp: u64,
    }

    struct CallStarted has copy, drop {
        session_id: ID,
        caller: address,
        callee: address,
        session_type: u8,
        timestamp: u64,
    }

    struct CallEnded has copy, drop {
        session_id: ID,
        duration: u64,
        timestamp: u64,
    }

    // Initialize the platform
    fun init(ctx: &mut TxContext) {
        let user_registry = UserRegistry {
            id: object::new(ctx),
            users: table::new(ctx),
            total_users: 0,
        };

        let match_registry = MatchRegistry {
            id: object::new(ctx),
            matches: table::new(ctx),
            swipes: table::new(ctx),
        };

        transfer::share_object(user_registry);
        transfer::share_object(match_registry);
    }

    // Register a new user
    public entry fun register_user(
        registry: &mut UserRegistry,
        name: String,
        bio: String,
        age: u8,
        location: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!table::contains(&registry.users, sender), E_ALREADY_REGISTERED);

        let timestamp = clock::timestamp_ms(clock);
        let profile = UserProfile {
            id: object::new(ctx),
            owner: sender,
            name,
            bio,
            age,
            profile_images: vector::empty(),
            location,
            interests: vector::empty(),
            is_active: true,
            created_at: timestamp,
            last_active: timestamp,
        };

        let profile_id = object::id(&profile);
        table::add(&mut registry.users, sender, profile_id);
        registry.total_users = registry.total_users + 1;

        event::emit(UserRegistered {
            user: sender,
            profile_id,
            timestamp,
        });

        transfer::share_object(profile);
    }

    // Update profile
    public entry fun update_profile(
        profile: &mut UserProfile,
        name: String,
        bio: String,
        age: u8,
        location: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), E_NOT_REGISTERED);
        
        profile.name = name;
        profile.bio = bio;
        profile.age = age;
        profile.location = location;
        profile.last_active = clock::timestamp_ms(clock);
    }

    // Add profile images
    public entry fun add_profile_images(
        profile: &mut UserProfile,
        images: vector<String>,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), E_NOT_REGISTERED);
        
        let i = 0;
        while (i < vector::length(&images)) {
            vector::push_back(&mut profile.profile_images, *vector::borrow(&images, i));
            i = i + 1;
        };
    }

    // Add interests
    public entry fun add_interests(
        profile: &mut UserProfile,
        interests: vector<String>,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), E_NOT_REGISTERED);
        
        let i = 0;
        while (i < vector::length(&interests)) {
            vector::push_back(&mut profile.interests, *vector::borrow(&interests, i));
            i = i + 1;
        };
    }

    // Swipe on another user
    public entry fun swipe(
        registry: &mut UserRegistry,
        match_registry: &mut MatchRegistry,
        swiped_address: address,
        is_like: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let swiper = tx_context::sender(ctx);
        assert!(swiper != swiped_address, E_CANNOT_SWIPE_SELF);
        assert!(table::contains(&registry.users, swiper), E_NOT_REGISTERED);
        assert!(table::contains(&registry.users, swiped_address), E_NOT_REGISTERED);

        // Check if already swiped
        if (!table::contains(&match_registry.swipes, swiper)) {
            table::add(&mut match_registry.swipes, swiper, table::new(ctx));
        };
        
        let swiper_swipes = table::borrow_mut(&mut match_registry.swipes, swiper);
        assert!(!table::contains(swiper_swipes, swiped_address), E_ALREADY_SWIPED);

        // Record the swipe
        table::add(swiper_swipes, swiped_address, is_like);
        let timestamp = clock::timestamp_ms(clock);

        event::emit(SwipeEvent {
            swiper,
            swiped: swiped_address,
            is_like,
            timestamp,
        });

        // Check for mutual like (match)
        if (is_like && has_liked_back(match_registry, swiped_address, swiper)) {
            create_match(match_registry, swiper, swiped_address, timestamp, ctx);
        }
    }

    // Check if user has liked back
    fun has_liked_back(match_registry: &MatchRegistry, user: address, target: address): bool {
        if (!table::contains(&match_registry.swipes, user)) {
            return false
        };
        
        let user_swipes = table::borrow(&match_registry.swipes, user);
        if (!table::contains(user_swipes, target)) {
            return false
        };
        
        *table::borrow(user_swipes, target)
    }

    // Create a match between two users
    fun create_match(
        match_registry: &mut MatchRegistry,
        user1: address,
        user2: address,
        timestamp: u64,
        ctx: &mut TxContext
    ) {
        let match = Match {
            id: object::new(ctx),
            user1,
            user2,
            matched_at: timestamp,
            is_active: true,
            chat_enabled: true,
        };

        let match_id = object::id(&match);

        // Add match to both users' match lists
        if (!table::contains(&match_registry.matches, user1)) {
            table::add(&mut match_registry.matches, user1, vector::empty());
        };
        if (!table::contains(&match_registry.matches, user2)) {
            table::add(&mut match_registry.matches, user2, vector::empty());
        };

        vector::push_back(table::borrow_mut(&mut match_registry.matches, user1), match_id);
        vector::push_back(table::borrow_mut(&mut match_registry.matches, user2), match_id);

        event::emit(MatchCreated {
            user1,
            user2,
            match_id,
            timestamp,
        });

        transfer::share_object(match);
    }

    // Start a call session
    public entry fun start_call(
        match: &Match,
        callee: address,
        session_type: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(
            (match.user1 == caller && match.user2 == callee) ||
            (match.user2 == caller && match.user1 == callee),
            E_NOT_MATCHED
        );
        assert!(match.is_active, E_NOT_MATCHED);

        let timestamp = clock::timestamp_ms(clock);
        let session = CallSession {
            id: object::new(ctx),
            caller,
            callee,
            session_type,
            started_at: timestamp,
            ended_at: option::none(),
            is_active: true,
        };

        let session_id = object::id(&session);
        event::emit(CallStarted {
            session_id,
            caller,
            callee,
            session_type,
            timestamp,
        });

        transfer::share_object(session);
    }

    // End a call session
    public entry fun end_call(
        session: &mut CallSession,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == session.caller || sender == session.callee,
            E_NOT_MATCHED
        );
        assert!(session.is_active, E_NOT_MATCHED);

        let end_time = clock::timestamp_ms(clock);
        session.ended_at = option::some(end_time);
        session.is_active = false;

        let duration = end_time - session.started_at;
        event::emit(CallEnded {
            session_id: object::id(session),
            duration,
            timestamp: end_time,
        });
    }

    // Unmatch users
    public entry fun unmatch(
        match: &mut Match,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == match.user1 || sender == match.user2,
            E_NOT_MATCHED
        );
        
        match.is_active = false;
        match.chat_enabled = false;
    }

    // Deactivate profile
    public entry fun deactivate_profile(
        profile: &mut UserProfile,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), E_NOT_REGISTERED);
        profile.is_active = false;
    }

    // Reactivate profile
    public entry fun reactivate_profile(
        profile: &mut UserProfile,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), E_NOT_REGISTERED);
        profile.is_active = true;
        profile.last_active = clock::timestamp_ms(clock);
    }

    // View functions
    public fun get_user_matches(match_registry: &MatchRegistry, user: address): vector<ID> {
        if (!table::contains(&match_registry.matches, user)) {
            return vector::empty()
        };
        
        *table::borrow(&match_registry.matches, user)
    }

    public fun is_registered(registry: &UserRegistry, user: address): bool {
        table::contains(&registry.users, user)
    }

    public fun get_total_users(registry: &UserRegistry): u64 {
        registry.total_users
    }
}