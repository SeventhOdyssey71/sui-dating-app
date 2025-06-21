#[test_only]
module discoveer::dating_platform_tests {
    use discoveer::dating_platform::{Self, UserRegistry, UserProfile, MatchRegistry, Match};
    use sui::test_scenario;
    use sui::clock;
    use std::string;

    #[test]
    fun test_user_registration() {
        let mut scenario = test_scenario::begin(@0x1);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        
        // Initialize platform
        {
            dating_platform::init(test_scenario::ctx(&mut scenario));
        };
        
        // Register first user
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            
            dating_platform::register_user(
                &mut registry,
                string::utf8(b"Alice"),
                string::utf8(b"Love hiking and coffee"),
                25,
                string::utf8(b"San Francisco"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            assert!(dating_platform::is_registered(&registry, @0x1), 0);
            assert!(dating_platform::get_total_users(&registry) == 1, 1);
            
            test_scenario::return_shared(registry);
        };
        
        // Register second user
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            
            dating_platform::register_user(
                &mut registry,
                string::utf8(b"Bob"),
                string::utf8(b"Foodie and traveler"),
                28,
                string::utf8(b"New York"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            assert!(dating_platform::is_registered(&registry, @0x2), 2);
            assert!(dating_platform::get_total_users(&registry) == 2, 3);
            
            test_scenario::return_shared(registry);
        };
        
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_swiping_and_matching() {
        let mut scenario = test_scenario::begin(@0x1);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        
        // Initialize and register users
        {
            dating_platform::init(test_scenario::ctx(&mut scenario));
        };
        
        // Register Alice
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            dating_platform::register_user(
                &mut registry,
                string::utf8(b"Alice"),
                string::utf8(b"Bio"),
                25,
                string::utf8(b"SF"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(registry);
        };
        
        // Register Bob
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            dating_platform::register_user(
                &mut registry,
                string::utf8(b"Bob"),
                string::utf8(b"Bio"),
                28,
                string::utf8(b"NYC"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(registry);
        };
        
        // Alice swipes right on Bob
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            let mut match_registry = test_scenario::take_shared<MatchRegistry>(&scenario);
            
            dating_platform::swipe(
                &mut registry,
                &mut match_registry,
                @0x2,
                true, // like
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(registry);
            test_scenario::return_shared(match_registry);
        };
        
        // Bob swipes right on Alice (creates match)
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            let mut match_registry = test_scenario::take_shared<MatchRegistry>(&scenario);
            
            dating_platform::swipe(
                &mut registry,
                &mut match_registry,
                @0x1,
                true, // like
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            // Check that match was created
            let alice_matches = dating_platform::get_user_matches(&match_registry, @0x1);
            let bob_matches = dating_platform::get_user_matches(&match_registry, @0x2);
            
            assert!(std::vector::length(&alice_matches) == 1, 4);
            assert!(std::vector::length(&bob_matches) == 1, 5);
            
            test_scenario::return_shared(registry);
            test_scenario::return_shared(match_registry);
        };
        
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_profile_updates() {
        let mut scenario = test_scenario::begin(@0x1);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        
        // Initialize and register user
        {
            dating_platform::init(test_scenario::ctx(&mut scenario));
        };
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            dating_platform::register_user(
                &mut registry,
                string::utf8(b"Alice"),
                string::utf8(b"Initial bio"),
                25,
                string::utf8(b"SF"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(registry);
        };
        
        // Update profile
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let mut profile = test_scenario::take_shared<UserProfile>(&scenario);
            
            dating_platform::update_profile(
                &mut profile,
                string::utf8(b"Alice Updated"),
                string::utf8(b"Updated bio"),
                26,
                string::utf8(b"Los Angeles"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            // Add interests
            let mut interests = std::vector::empty<std::string::String>();
            std::vector::push_back(&mut interests, string::utf8(b"Hiking"));
            std::vector::push_back(&mut interests, string::utf8(b"Photography"));
            
            dating_platform::add_interests(
                &mut profile,
                interests,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(profile);
        };
        
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 4)] // E_CANNOT_SWIPE_SELF
    fun test_cannot_swipe_self() {
        let mut scenario = test_scenario::begin(@0x1);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        
        // Initialize and register user
        {
            dating_platform::init(test_scenario::ctx(&mut scenario));
        };
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            dating_platform::register_user(
                &mut registry,
                string::utf8(b"Alice"),
                string::utf8(b"Bio"),
                25,
                string::utf8(b"SF"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(registry);
        };
        
        // Try to swipe on self
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            let mut match_registry = test_scenario::take_shared<MatchRegistry>(&scenario);
            
            dating_platform::swipe(
                &mut registry,
                &mut match_registry,
                @0x1, // swiping on self
                true,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(registry);
            test_scenario::return_shared(match_registry);
        };
        
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_call_sessions() {
        let mut scenario = test_scenario::begin(@0x1);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        
        // Setup: Initialize, register users, and create match
        {
            dating_platform::init(test_scenario::ctx(&mut scenario));
        };
        
        // Register and match Alice and Bob
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            dating_platform::register_user(
                &mut registry,
                string::utf8(b"Alice"),
                string::utf8(b"Bio"),
                25,
                string::utf8(b"SF"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(registry);
        };
        
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            dating_platform::register_user(
                &mut registry,
                string::utf8(b"Bob"),
                string::utf8(b"Bio"),
                28,
                string::utf8(b"NYC"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(registry);
        };
        
        // Create match
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            let mut match_registry = test_scenario::take_shared<MatchRegistry>(&scenario);
            dating_platform::swipe(&mut registry, &mut match_registry, @0x2, true, &clock, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(registry);
            test_scenario::return_shared(match_registry);
        };
        
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut registry = test_scenario::take_shared<UserRegistry>(&scenario);
            let mut match_registry = test_scenario::take_shared<MatchRegistry>(&scenario);
            dating_platform::swipe(&mut registry, &mut match_registry, @0x1, true, &clock, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(registry);
            test_scenario::return_shared(match_registry);
        };
        
        // Start video call
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let match = test_scenario::take_shared<Match>(&scenario);
            
            dating_platform::start_call(
                &match,
                @0x2,
                1, // video call
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(match);
        };
        
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}