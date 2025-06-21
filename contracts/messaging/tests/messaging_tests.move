#[test_only]
module discoveer_messaging::messaging_tests {
    use discoveer_messaging::messaging::{Self, MessageHub, Message};
    use sui::test_scenario;
    use sui::clock;
    use std::string;

    const ALICE: address = @0xA;
    const BOB: address = @0xB;

    #[test]
    fun test_send_message() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;
        
        // Initialize
        messaging::init_for_testing(test_scenario::ctx(scenario));
        test_scenario::next_tx(scenario, ALICE);

        // Create clock
        let clock = clock::create_for_testing(test_scenario::ctx(scenario));
        clock::set_for_testing(&mut clock, 1000);

        // Send message
        {
            let hub = test_scenario::take_shared<MessageHub>(scenario);
            let message_content = b"Hello Bob!";
            
            messaging::send_message(
                &mut hub,
                BOB,
                message_content,
                &clock,
                test_scenario::ctx(scenario)
            );

            assert!(messaging::get_message_count(&hub) == 1, 0);
            test_scenario::return_shared(hub);
        };

        // Bob receives the message
        test_scenario::next_tx(scenario, BOB);
        {
            let message = test_scenario::take_from_sender<Message>(scenario);
            assert!(messaging::get_message_sender(&message) == ALICE, 0);
            assert!(messaging::get_message_content(&message) == string::utf8(b"Hello Bob!"), 0);
            assert!(!messaging::is_message_read(&message), 0);
            test_scenario::return_to_sender(scenario, message);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_mark_as_read() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;
        
        messaging::init_for_testing(test_scenario::ctx(scenario));
        test_scenario::next_tx(scenario, ALICE);

        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        // Send message
        {
            let hub = test_scenario::take_shared<MessageHub>(scenario);
            messaging::send_message(
                &mut hub,
                BOB,
                b"Test message",
                &clock,
                test_scenario::ctx(scenario)
            );
            test_scenario::return_shared(hub);
        };

        // Bob marks as read
        test_scenario::next_tx(scenario, BOB);
        {
            let message = test_scenario::take_from_sender<Message>(scenario);
            messaging::mark_as_read(&mut message, &clock, test_scenario::ctx(scenario));
            assert!(messaging::is_message_read(&message), 0);
            test_scenario::return_to_sender(scenario, message);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = messaging::EInvalidRecipient)]
    fun test_send_to_self_fails() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;
        
        messaging::init_for_testing(test_scenario::ctx(scenario));
        test_scenario::next_tx(scenario, ALICE);

        let clock = clock::create_for_testing(test_scenario::ctx(scenario));

        {
            let hub = test_scenario::take_shared<MessageHub>(scenario);
            messaging::send_message(
                &mut hub,
                ALICE, // Sending to self
                b"Hello myself",
                &clock,
                test_scenario::ctx(scenario)
            );
            test_scenario::return_shared(hub);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }
}