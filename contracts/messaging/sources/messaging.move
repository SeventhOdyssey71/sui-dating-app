module discoveer_messaging::messaging {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use sui::table::{Self, Table};
    use sui::dynamic_object_field;

    // Error codes
    const ENotAuthorized: u64 = 1;
    const EMessageNotFound: u64 = 2;
    const EInvalidRecipient: u64 = 3;
    const EEmptyMessage: u64 = 4;

    // Structs
    struct MessageHub has key {
        id: UID,
        conversations: Table<address, Conversation>,
        message_count: u64,
    }

    struct Conversation has store {
        messages: vector<ID>,
        participants: vector<address>,
        last_message_time: u64,
    }

    struct Message has key, store {
        id: UID,
        sender: address,
        recipient: address,
        content: String,
        timestamp: u64,
        is_read: bool,
        reply_to: Option<ID>,
    }

    struct MessageMetadata has key, store {
        id: UID,
        sender: address,
        recipient: address,
        timestamp: u64,
        is_encrypted: bool,
        message_ref: ID,
    }

    // Events
    struct MessageSent has copy, drop {
        message_id: ID,
        sender: address,
        recipient: address,
        content: vector<u8>,
        timestamp: u64,
        reply_to: Option<ID>,
    }

    struct MessageRead has copy, drop {
        message_id: ID,
        reader: address,
        timestamp: u64,
    }

    // Initialize the messaging system
    fun init(ctx: &mut TxContext) {
        let message_hub = MessageHub {
            id: object::new(ctx),
            conversations: table::new(ctx),
            message_count: 0,
        };
        transfer::share_object(message_hub);
    }

    // Send a message
    public entry fun send_message(
        hub: &mut MessageHub,
        recipient: address,
        content: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender != recipient, EInvalidRecipient);
        assert!(!vector::is_empty(&content), EEmptyMessage);

        let message_content = string::utf8(content);
        let timestamp = clock::timestamp_ms(clock);
        
        let message = Message {
            id: object::new(ctx),
            sender,
            recipient,
            content: message_content,
            timestamp,
            is_read: false,
            reply_to: option::none(),
        };

        let message_id = object::id(&message);
        
        // Create metadata for indexing
        let metadata = MessageMetadata {
            id: object::new(ctx),
            sender,
            recipient,
            timestamp,
            is_encrypted: false,
            message_ref: message_id,
        };

        // Update sender's conversation
        update_conversation(hub, sender, recipient, message_id, timestamp, ctx);
        
        // Update recipient's conversation
        update_conversation(hub, recipient, sender, message_id, timestamp, ctx);

        hub.message_count = hub.message_count + 1;

        // Emit event
        event::emit(MessageSent {
            message_id,
            sender,
            recipient,
            content,
            timestamp,
            reply_to: option::none(),
        });

        // Transfer objects
        transfer::transfer(message, recipient);
        transfer::share_object(metadata);
    }

    // Send a reply message
    public entry fun reply_to_message(
        hub: &mut MessageHub,
        recipient: address,
        content: vector<u8>,
        reply_to_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender != recipient, EInvalidRecipient);
        assert!(!vector::is_empty(&content), EEmptyMessage);

        let message_content = string::utf8(content);
        let timestamp = clock::timestamp_ms(clock);
        
        let message = Message {
            id: object::new(ctx),
            sender,
            recipient,
            content: message_content,
            timestamp,
            is_read: false,
            reply_to: option::some(reply_to_id),
        };

        let message_id = object::id(&message);
        
        // Update conversations
        update_conversation(hub, sender, recipient, message_id, timestamp, ctx);
        update_conversation(hub, recipient, sender, message_id, timestamp, ctx);

        hub.message_count = hub.message_count + 1;

        event::emit(MessageSent {
            message_id,
            sender,
            recipient,
            content,
            timestamp,
            reply_to: option::some(reply_to_id),
        });

        transfer::transfer(message, recipient);
    }

    // Mark message as read
    public entry fun mark_as_read(
        message: &mut Message,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let reader = tx_context::sender(ctx);
        assert!(reader == message.recipient, ENotAuthorized);
        
        message.is_read = true;
        
        event::emit(MessageRead {
            message_id: object::id(message),
            reader,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Helper function to update conversations
    fun update_conversation(
        hub: &mut MessageHub,
        user: address,
        other_user: address,
        message_id: ID,
        timestamp: u64,
        _ctx: &mut TxContext
    ) {
        if (!table::contains(&hub.conversations, user)) {
            let conversation = Conversation {
                messages: vector::empty(),
                participants: vector[user, other_user],
                last_message_time: timestamp,
            };
            table::add(&mut hub.conversations, user, conversation);
        };

        let conversation = table::borrow_mut(&mut hub.conversations, user);
        vector::push_back(&mut conversation.messages, message_id);
        conversation.last_message_time = timestamp;
    }

    // Get conversation info (off-chain view)
    public fun get_conversation_info(
        hub: &MessageHub,
        user: address
    ): (vector<ID>, u64) {
        if (table::contains(&hub.conversations, user)) {
            let conversation = table::borrow(&hub.conversations, user);
            (conversation.messages, conversation.last_message_time)
        } else {
            (vector::empty(), 0)
        }
    }

    // Get message count
    public fun get_message_count(hub: &MessageHub): u64 {
        hub.message_count
    }

    // Message content getter
    public fun get_message_content(message: &Message): String {
        message.content
    }

    // Message sender getter
    public fun get_message_sender(message: &Message): address {
        message.sender
    }

    // Message timestamp getter
    public fun get_message_timestamp(message: &Message): u64 {
        message.timestamp
    }

    // Check if message is read
    public fun is_message_read(message: &Message): bool {
        message.is_read
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }
}