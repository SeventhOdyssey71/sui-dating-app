module discoveer_games::group_chat {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Option};
    use sui::vec_set::{Self, VecSet};
    use sui::table::{Self, Table};

    // ===== Constants =====
    const EGROUP_NOT_FOUND: u64 = 0;
    const ENOT_MEMBER: u64 = 1;
    const EALREADY_MEMBER: u64 = 2;
    #[allow(unused_const)]
    const ENO_ACCESS: u64 = 3;
    const ENOT_ADMIN: u64 = 4;
    const EINVALID_NFT: u64 = 5;
    const EGROUP_FULL: u64 = 6;
    const MAX_GROUP_SIZE: u64 = 100;
    const MAX_MESSAGE_LENGTH: u64 = 1000;

    // ===== Structs =====
    
    struct GroupRegistry has key {
        id: UID,
        groups: Table<ID, GroupInfo>,
        user_groups: Table<address, vector<ID>>,
        total_groups: u64,
        total_messages: u64,
    }

    struct GroupInfo has store {
        name: String,
        description: String,
        admin: address,
        members: VecSet<address>,
        nft_requirements: vector<NFTRequirement>,
        messages: vector<GroupMessage>,
        created_at: u64,
        is_public: bool,
        max_members: u64,
    }

    struct NFTRequirement has store, drop, copy {
        collection_id: ID,
        min_count: u64,
    }

    struct GroupMessage has store, drop, copy {
        sender: address,
        content: String,
        timestamp: u64,
        reply_to: Option<u64>,
    }

    struct Group has key {
        id: UID,
        info: GroupInfo,
    }

    struct MembershipProof has key {
        id: UID,
        group_id: ID,
        member: address,
        joined_at: u64,
    }

    // ===== Events =====
    
    struct GroupCreated has copy, drop {
        group_id: ID,
        name: String,
        admin: address,
        is_public: bool,
    }

    struct MemberJoined has copy, drop {
        group_id: ID,
        member: address,
        timestamp: u64,
    }

    struct MessageSent has copy, drop {
        group_id: ID,
        sender: address,
        message_index: u64,
        timestamp: u64,
    }

    // ===== Constructor =====
    
    fun init(ctx: &mut TxContext) {
        transfer::share_object(GroupRegistry {
            id: object::new(ctx),
            groups: table::new(ctx),
            user_groups: table::new(ctx),
            total_groups: 0,
            total_messages: 0,
        });
    }

    // ===== Public Functions =====
    
    public entry fun create_group(
        registry: &mut GroupRegistry,
        name: String,
        description: String,
        is_public: bool,
        max_members: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let admin = tx_context::sender(ctx);
        let members = vec_set::singleton(admin);
        
        let group_info = GroupInfo {
            name,
            description,
            admin,
            members,
            nft_requirements: vector::empty(),
            messages: vector::empty(),
            created_at: clock::timestamp_ms(clock),
            is_public,
            max_members: if (max_members == 0 || max_members > MAX_GROUP_SIZE) { 
                MAX_GROUP_SIZE 
            } else { 
                max_members 
            },
        };
        
        let group = Group {
            id: object::new(ctx),
            info: group_info,
        };
        
        let group_id = object::uid_to_inner(&group.id);
        
        // Add to registry
        let group_info_copy = GroupInfo {
            name: group.info.name,
            description: group.info.description,
            admin: group.info.admin,
            members: group.info.members,
            nft_requirements: group.info.nft_requirements,
            messages: group.info.messages,
            created_at: group.info.created_at,
            is_public: group.info.is_public,
            max_members: group.info.max_members,
        };
        table::add(&mut registry.groups, group_id, group_info_copy);
        
        // Update user groups
        if (!table::contains(&registry.user_groups, admin)) {
            table::add(&mut registry.user_groups, admin, vector::empty());
        };
        let user_groups = table::borrow_mut(&mut registry.user_groups, admin);
        vector::push_back(user_groups, group_id);
        
        registry.total_groups = registry.total_groups + 1;
        
        event::emit(GroupCreated {
            group_id,
            name: group.info.name,
            admin,
            is_public,
        });
        
        // Create membership proof for admin
        transfer::transfer(MembershipProof {
            id: object::new(ctx),
            group_id,
            member: admin,
            joined_at: clock::timestamp_ms(clock),
        }, admin);
        
        transfer::share_object(group);
    }

    public entry fun add_nft_requirement(
        registry: &mut GroupRegistry,
        group_id: ID,
        collection_id: ID,
        min_count: u64,
        ctx: &TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.groups, group_id), EGROUP_NOT_FOUND);
        
        let group_info = table::borrow_mut(&mut registry.groups, group_id);
        assert!(group_info.admin == sender, ENOT_ADMIN);
        
        vector::push_back(&mut group_info.nft_requirements, NFTRequirement {
            collection_id,
            min_count,
        });
    }

    public entry fun join_group(
        registry: &mut GroupRegistry,
        group: &mut Group,
        nft_proofs: vector<ID>, // IDs of NFTs owned by user
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let member = tx_context::sender(ctx);
        let group_id = object::uid_to_inner(&group.id);
        
        assert!(table::contains(&registry.groups, group_id), EGROUP_NOT_FOUND);
        let group_info = table::borrow_mut(&mut registry.groups, group_id);
        
        assert!(!vec_set::contains(&group_info.members, &member), EALREADY_MEMBER);
        assert!(vec_set::size(&group_info.members) < group_info.max_members, EGROUP_FULL);
        
        // Verify NFT requirements
        verify_nft_requirements(&group_info.nft_requirements, &nft_proofs);
        
        // Add member
        vec_set::insert(&mut group_info.members, member);
        
        // Update user groups
        if (!table::contains(&registry.user_groups, member)) {
            table::add(&mut registry.user_groups, member, vector::empty());
        };
        let user_groups = table::borrow_mut(&mut registry.user_groups, member);
        vector::push_back(user_groups, group_id);
        
        let joined_at = clock::timestamp_ms(clock);
        
        event::emit(MemberJoined {
            group_id,
            member,
            timestamp: joined_at,
        });
        
        // Create membership proof
        transfer::transfer(MembershipProof {
            id: object::new(ctx),
            group_id,
            member,
            joined_at,
        }, member);
    }

    public entry fun send_message(
        registry: &mut GroupRegistry,
        group: &mut Group,
        content: String,
        reply_to: Option<u64>,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        let group_id = object::uid_to_inner(&group.id);
        
        assert!(table::contains(&registry.groups, group_id), EGROUP_NOT_FOUND);
        let group_info = table::borrow_mut(&mut registry.groups, group_id);
        
        assert!(vec_set::contains(&group_info.members, &sender), ENOT_MEMBER);
        assert!(string::length(&content) <= MAX_MESSAGE_LENGTH, 7); // EMESSAGE_TOO_LONG
        
        let message = GroupMessage {
            sender,
            content,
            timestamp: clock::timestamp_ms(clock),
            reply_to,
        };
        
        let message_index = vector::length(&group_info.messages);
        vector::push_back(&mut group_info.messages, message);
        
        registry.total_messages = registry.total_messages + 1;
        
        event::emit(MessageSent {
            group_id,
            sender,
            message_index,
            timestamp: message.timestamp,
        });
    }

    public entry fun leave_group(
        registry: &mut GroupRegistry,
        group: &mut Group,
        ctx: &TxContext,
    ) {
        let member = tx_context::sender(ctx);
        let group_id = object::uid_to_inner(&group.id);
        
        assert!(table::contains(&registry.groups, group_id), EGROUP_NOT_FOUND);
        let group_info = table::borrow_mut(&mut registry.groups, group_id);
        
        assert!(vec_set::contains(&group_info.members, &member), ENOT_MEMBER);
        assert!(member != group_info.admin, 8); // EADMIN_CANNOT_LEAVE
        
        vec_set::remove(&mut group_info.members, &member);
        
        // Remove from user groups
        if (table::contains(&registry.user_groups, member)) {
            let user_groups = table::borrow_mut(&mut registry.user_groups, member);
            let (found, index) = vector::index_of(user_groups, &group_id);
            if (found) {
                vector::remove(user_groups, index);
            };
        };
    }

    // ===== View Functions =====
    
    public fun get_group_info(registry: &GroupRegistry, group_id: ID): &GroupInfo {
        table::borrow(&registry.groups, group_id)
    }

    public fun get_user_groups(registry: &GroupRegistry, user: address): vector<ID> {
        if (table::contains(&registry.user_groups, user)) {
            *table::borrow(&registry.user_groups, user)
        } else {
            vector::empty()
        }
    }

    public fun get_messages(
        registry: &GroupRegistry, 
        group_id: ID,
        start: u64,
        limit: u64,
    ): vector<GroupMessage> {
        assert!(table::contains(&registry.groups, group_id), EGROUP_NOT_FOUND);
        let group_info = table::borrow(&registry.groups, group_id);
        
        let messages = &group_info.messages;
        let total = vector::length(messages);
        let end = if (start + limit > total) { total } else { start + limit };
        
        let result = vector::empty();
        let i = start;
        while (i < end) {
            vector::push_back(&mut result, *vector::borrow(messages, i));
            i = i + 1;
        };
        
        result
    }

    // ===== Private Functions =====
    
    fun verify_nft_requirements(
        requirements: &vector<NFTRequirement>,
        nft_proofs: &vector<ID>,
    ) {
        // In production, this would verify actual NFT ownership
        // For now, we'll do a simple check
        let i = 0;
        let len = vector::length(requirements);
        
        while (i < len) {
            let req = vector::borrow(requirements, i);
            let count = count_nfts_for_collection(nft_proofs, req.collection_id);
            assert!(count >= req.min_count, EINVALID_NFT);
            i = i + 1;
        };
    }

    fun count_nfts_for_collection(nft_proofs: &vector<ID>, _collection_id: ID): u64 {
        // Simplified for demo - in production would verify actual ownership
        let count = 0;
        let i = 0;
        let len = vector::length(nft_proofs);
        
        while (i < len) {
            // In production: verify NFT belongs to collection
            count = count + 1;
            i = i + 1;
        };
        
        count
    }

    // ===== Tests =====
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(ctx);
    }
}