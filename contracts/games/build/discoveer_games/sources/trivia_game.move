module discoveer_games::trivia_game {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use std::vector;
    use std::string::{Self, String};
    use std::option;

    // ===== Constants =====
    const EINSUFFICIENT_ENTRY_FEE: u64 = 0;
    const EQUESTION_NOT_ACTIVE: u64 = 1;
    #[allow(unused_const)]
    const EALREADY_ANSWERED: u64 = 2;
    const EINVALID_ANSWER: u64 = 3;
    const EGAME_PAUSED: u64 = 4;
    const ENTRY_FEE: u64 = 50_000_000; // 0.05 SUI
    const REWARD_POOL_PERCENTAGE: u64 = 80; // 80% goes to reward pool

    // ===== Structs =====
    
    struct TriviaHub has key {
        id: UID,
        balance: Balance<SUI>,
        current_question: option::Option<Question>,
        questions_pool: vector<Question>,
        leaderboard: vector<TriviaLeaderEntry>,
        total_questions_answered: u64,
        paused: bool,
    }

    struct Question has store, drop, copy {
        id: u64,
        question: String,
        options: vector<String>,
        correct_answer: u8,
        reward_pool: u64,
        active_until: u64,
        total_attempts: u64,
        correct_attempts: u64,
    }

    struct TriviaLeaderEntry has store, drop, copy {
        player: address,
        correct_answers: u64,
        total_attempts: u64,
        total_earnings: u64,
        streak: u64,
        best_streak: u64,
    }

    struct PlayerAnswer has key {
        id: UID,
        player: address,
        question_id: u64,
        answer: u8,
        correct: bool,
        timestamp: u64,
    }

    // ===== Events =====
    
    struct QuestionAnswered has copy, drop {
        player: address,
        question_id: u64,
        answer: u8,
        correct: bool,
        reward: u64,
    }

    struct NewQuestionActivated has copy, drop {
        question_id: u64,
        reward_pool: u64,
        active_until: u64,
    }

    // ===== Constructor =====
    
    fun init(ctx: &mut TxContext) {
        let hub = TriviaHub {
            id: object::new(ctx),
            balance: balance::zero(),
            current_question: option::none(),
            questions_pool: create_initial_questions(),
            leaderboard: vector::empty(),
            total_questions_answered: 0,
            paused: false,
        };
        
        transfer::share_object(hub);
    }

    // ===== Public Functions =====
    
    public entry fun answer_question(
        hub: &mut TriviaHub,
        answer: u8,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!hub.paused, EGAME_PAUSED);
        assert!(coin::value(&payment) >= ENTRY_FEE, EINSUFFICIENT_ENTRY_FEE);
        assert!(option::is_some(&hub.current_question), EQUESTION_NOT_ACTIVE);
        
        let question = option::borrow(&hub.current_question);
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time <= question.active_until, EQUESTION_NOT_ACTIVE);
        assert!((answer as u64) < vector::length(&question.options), EINVALID_ANSWER);
        
        let player = tx_context::sender(ctx);
        let is_correct = answer == question.correct_answer;
        let reward = 0u64;
        
        // Add entry fee to balance
        coin::put(&mut hub.balance, payment);
        
        if (is_correct) {
            // Calculate reward based on speed and correctness
            let time_bonus = calculate_time_bonus(question.active_until, current_time);
            reward = (question.reward_pool * time_bonus) / 100;
            
            // Pay out reward
            if (reward > 0 && balance::value(&hub.balance) >= reward) {
                let reward_coin = coin::take(&mut hub.balance, reward, ctx);
                transfer::public_transfer(reward_coin, player);
            };
        };
        
        // Update question stats would be done here in production
        
        // Store question id for later use
        let q_id = question.id;
        
        // Update leaderboard
        update_trivia_leaderboard(hub, player, is_correct, reward);
        
        // Create answer record
        let answer_record = PlayerAnswer {
            id: object::new(ctx),
            player,
            question_id: q_id,
            answer,
            correct: is_correct,
            timestamp: current_time,
        };
        
        // Emit event
        event::emit(QuestionAnswered {
            player,
            question_id: q_id,
            answer,
            correct: is_correct,
            reward,
        });
        
        transfer::transfer(answer_record, player);
        
        hub.total_questions_answered = hub.total_questions_answered + 1;
        
        // Activate new question if current expired
        let should_activate_new = {
            let q = option::borrow(&hub.current_question);
            current_time > q.active_until
        };
        if (should_activate_new) {
            activate_random_question(hub, clock, ctx);
        };
    }

    public entry fun activate_random_question(
        hub: &mut TriviaHub,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let pool_size = vector::length(&hub.questions_pool);
        if (pool_size == 0) return;
        
        // Simple random selection
        let timestamp = clock::timestamp_ms(clock);
        let seed = timestamp + tx_context::epoch(ctx);
        let random_index = seed % pool_size;
        
        let question = *vector::borrow(&hub.questions_pool, random_index);
        let new_question = Question {
            id: question.id,
            question: question.question,
            options: question.options,
            correct_answer: question.correct_answer,
            reward_pool: balance::value(&hub.balance) * REWARD_POOL_PERCENTAGE / 100,
            active_until: timestamp + 300000, // 5 minutes
            total_attempts: question.total_attempts,
            correct_attempts: question.correct_attempts,
        };
        
        hub.current_question = option::some(new_question);
        
        event::emit(NewQuestionActivated {
            question_id: new_question.id,
            reward_pool: new_question.reward_pool,
            active_until: new_question.active_until,
        });
    }

    public entry fun add_question(
        _: &AdminCap,
        hub: &mut TriviaHub,
        question_text: String,
        option1: String,
        option2: String,
        option3: String,
        option4: String,
        correct_answer: u8,
    ) {
        let options = vector::empty();
        vector::push_back(&mut options, option1);
        vector::push_back(&mut options, option2);
        vector::push_back(&mut options, option3);
        vector::push_back(&mut options, option4);
        
        let question = Question {
            id: vector::length(&hub.questions_pool),
            question: question_text,
            options,
            correct_answer,
            reward_pool: 0,
            active_until: 0,
            total_attempts: 0,
            correct_attempts: 0,
        };
        
        vector::push_back(&mut hub.questions_pool, question);
    }

    // ===== View Functions =====
    
    public fun get_current_question(hub: &TriviaHub): option::Option<Question> {
        hub.current_question
    }

    public fun get_leaderboard(hub: &TriviaHub): vector<TriviaLeaderEntry> {
        hub.leaderboard
    }

    // ===== Private Functions =====
    
    fun calculate_time_bonus(active_until: u64, current_time: u64): u64 {
        let time_remaining = active_until - current_time;
        let total_time = 300000u64; // 5 minutes
        
        // Linear decay from 100% to 50% based on time
        50 + (50 * time_remaining / total_time)
    }

    fun update_trivia_leaderboard(
        hub: &mut TriviaHub,
        player: address,
        correct: bool,
        earnings: u64,
    ) {
        let i = 0;
        let len = vector::length(&hub.leaderboard);
        let found = false;

        while (i < len) {
            let entry = vector::borrow_mut(&mut hub.leaderboard, i);
            if (entry.player == player) {
                entry.total_attempts = entry.total_attempts + 1;
                if (correct) {
                    entry.correct_answers = entry.correct_answers + 1;
                    entry.streak = entry.streak + 1;
                    if (entry.streak > entry.best_streak) {
                        entry.best_streak = entry.streak;
                    };
                } else {
                    entry.streak = 0;
                };
                entry.total_earnings = entry.total_earnings + earnings;
                found = true;
                break
            };
            i = i + 1;
        };

        if (!found) {
            vector::push_back(&mut hub.leaderboard, TriviaLeaderEntry {
                player,
                correct_answers: if (correct) 1 else 0,
                total_attempts: 1,
                total_earnings: earnings,
                streak: if (correct) 1 else 0,
                best_streak: if (correct) 1 else 0,
            });
        };
    }

    fun create_initial_questions(): vector<Question> {
        let questions = vector::empty();
        
        // Add some initial questions
        let q1_options = vector::empty();
        vector::push_back(&mut q1_options, string::utf8(b"Satoshi Nakamoto"));
        vector::push_back(&mut q1_options, string::utf8(b"Vitalik Buterin"));
        vector::push_back(&mut q1_options, string::utf8(b"Gavin Wood"));
        vector::push_back(&mut q1_options, string::utf8(b"Charlie Lee"));
        
        vector::push_back(&mut questions, Question {
            id: 0,
            question: string::utf8(b"Who created Bitcoin?"),
            options: q1_options,
            correct_answer: 0,
            reward_pool: 0,
            active_until: 0,
            total_attempts: 0,
            correct_attempts: 0,
        });
        
        let q2_options = vector::empty();
        vector::push_back(&mut q2_options, string::utf8(b"2008"));
        vector::push_back(&mut q2_options, string::utf8(b"2009"));
        vector::push_back(&mut q2_options, string::utf8(b"2010"));
        vector::push_back(&mut q2_options, string::utf8(b"2011"));
        
        vector::push_back(&mut questions, Question {
            id: 1,
            question: string::utf8(b"When was the Bitcoin whitepaper published?"),
            options: q2_options,
            correct_answer: 0,
            reward_pool: 0,
            active_until: 0,
            total_attempts: 0,
            correct_attempts: 0,
        });
        
        questions
    }

    // ===== Admin =====
    
    struct AdminCap has key { id: UID }

    #[allow(unused_function)]
    fun init_admin(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx),
        }, tx_context::sender(ctx));
    }

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(ctx);
        init_admin(ctx);
    }
}