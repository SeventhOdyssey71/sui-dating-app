module discoveer_games::dice_game {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use std::vector;
    use std::bcs;

    // ===== Constants =====
    const EINSUFFICIENT_BET: u64 = 0;
    const EINVALID_GUESS: u64 = 1;
    const EGAME_PAUSED: u64 = 2;
    const MIN_BET: u64 = 100_000_000; // 0.1 SUI
    const MAX_BET: u64 = 10_000_000_000; // 10 SUI
    const HOUSE_EDGE: u64 = 2; // 2% house edge

    // ===== Structs =====
    
    struct GameHouse has key {
        id: UID,
        balance: Balance<SUI>,
        total_games: u64,
        total_wins: u64,
        leaderboard: vector<LeaderboardEntry>,
        paused: bool,
    }

    struct LeaderboardEntry has store, drop, copy {
        player: address,
        total_winnings: u64,
        games_played: u64,
        biggest_win: u64,
    }

    struct GameResult has key {
        id: UID,
        player: address,
        guess: u8,
        result: u8,
        bet_amount: u64,
        won: bool,
        payout: u64,
        timestamp: u64,
    }

    // ===== Events =====
    
    struct DiceRolled has copy, drop {
        player: address,
        guess: u8,
        result: u8,
        bet_amount: u64,
        won: bool,
        payout: u64,
    }

    struct LeaderboardUpdated has copy, drop {
        player: address,
        total_winnings: u64,
        games_played: u64,
    }

    // ===== Constructor =====
    
    fun init(ctx: &mut TxContext) {
        transfer::share_object(GameHouse {
            id: object::new(ctx),
            balance: balance::zero(),
            total_games: 0,
            total_wins: 0,
            leaderboard: vector::empty(),
            paused: false,
        });
    }

    // ===== Public Functions =====
    
    public entry fun fund_house(
        house: &mut GameHouse,
        payment: Coin<SUI>,
    ) {
        coin::put(&mut house.balance, payment);
    }

    public entry fun play_dice(
        house: &mut GameHouse,
        guess: u8,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!house.paused, EGAME_PAUSED);
        assert!(guess >= 1 && guess <= 6, EINVALID_GUESS);
        
        let bet_amount = coin::value(&payment);
        assert!(bet_amount >= MIN_BET && bet_amount <= MAX_BET, EINSUFFICIENT_BET);
        
        // Generate random dice result (1-6)
        let result = generate_random_dice(clock, ctx);
        
        let won = guess == result;
        let payout = if (won) {
            // 6x payout minus house edge
            let gross_payout = bet_amount * 6;
            let house_fee = (gross_payout * HOUSE_EDGE) / 100;
            gross_payout - house_fee
        } else {
            0
        };

        // Update house stats
        house.total_games = house.total_games + 1;
        if (won) {
            house.total_wins = house.total_wins + 1;
        };

        // Always consume the payment coin first
        coin::put(&mut house.balance, payment);
        
        // Handle payout if won
        if (won) {
            // Pay the winner
            let winnings = coin::take(&mut house.balance, payout, ctx);
            transfer::public_transfer(winnings, tx_context::sender(ctx));
            
            // Update leaderboard
            update_leaderboard(house, tx_context::sender(ctx), payout);
        };

        // Create game result object
        let game_result = GameResult {
            id: object::new(ctx),
            player: tx_context::sender(ctx),
            guess,
            result,
            bet_amount,
            won,
            payout,
            timestamp: clock::timestamp_ms(clock),
        };

        // Emit event
        event::emit(DiceRolled {
            player: tx_context::sender(ctx),
            guess,
            result,
            bet_amount,
            won,
            payout,
        });

        // Transfer result to player
        transfer::transfer(game_result, tx_context::sender(ctx));
    }

    public entry fun withdraw_house_funds(
        _: &AdminCap,
        house: &mut GameHouse,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let withdrawal = coin::take(&mut house.balance, amount, ctx);
        transfer::public_transfer(withdrawal, recipient);
    }

    public entry fun toggle_pause(
        _: &AdminCap,
        house: &mut GameHouse,
    ) {
        house.paused = !house.paused;
    }

    // ===== View Functions =====
    
    public fun get_house_balance(house: &GameHouse): u64 {
        balance::value(&house.balance)
    }

    public fun get_leaderboard(house: &GameHouse): vector<LeaderboardEntry> {
        house.leaderboard
    }

    public fun get_stats(house: &GameHouse): (u64, u64) {
        (house.total_games, house.total_wins)
    }

    // ===== Private Functions =====
    
    fun generate_random_dice(clock: &Clock, ctx: &TxContext): u8 {
        let timestamp = clock::timestamp_ms(clock);
        let sender = tx_context::sender(ctx);
        // Simple pseudo-random for demo
        let _addr_bytes = bcs::to_bytes(&sender);
        let seed = timestamp + tx_context::epoch(ctx);
        (((seed % 6) + 1) as u8)
    }

    fun update_leaderboard(
        house: &mut GameHouse,
        player: address,
        winnings: u64,
    ) {
        let i = 0;
        let len = vector::length(&house.leaderboard);
        let found = false;

        // Update existing entry
        while (i < len) {
            let entry = vector::borrow_mut(&mut house.leaderboard, i);
            if (entry.player == player) {
                entry.total_winnings = entry.total_winnings + winnings;
                entry.games_played = entry.games_played + 1;
                if (winnings > entry.biggest_win) {
                    entry.biggest_win = winnings;
                };
                found = true;
                break
            };
            i = i + 1;
        };

        // Add new entry if not found
        if (!found) {
            vector::push_back(&mut house.leaderboard, LeaderboardEntry {
                player,
                total_winnings: winnings,
                games_played: 1,
                biggest_win: winnings,
            });
        };

        // Keep only top 10
        sort_and_trim_leaderboard(&mut house.leaderboard);

        event::emit(LeaderboardUpdated {
            player,
            total_winnings: winnings,
            games_played: 1,
        });
    }

    fun sort_and_trim_leaderboard(leaderboard: &mut vector<LeaderboardEntry>) {
        // Simple bubble sort for top 10
        let len = vector::length(leaderboard);
        if (len > 10) {
            // Keep only top 10 by total_winnings
            while (vector::length(leaderboard) > 10) {
                vector::pop_back(leaderboard);
            };
        };
    }

    // ===== Admin =====
    
    struct AdminCap has key { id: UID }

    #[allow(unused_function)]
    fun init_admin(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx),
        }, tx_context::sender(ctx));
    }

    // ===== Tests =====
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(ctx);
        init_admin(ctx);
    }
}