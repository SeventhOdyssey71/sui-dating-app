module discoveer_nft::nft {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};
    use sui::url::{Self, Url};
    use sui::display;
    use sui::package;
    use std::vector;

    // Error codes
    const ENotOwner: u64 = 1;
    const EInvalidCollection: u64 = 2;
    const EInvalidMetadata: u64 = 3;

    // One-time witness for the module
    struct NFT has drop {}

    // NFT object that can be owned and transferred
    struct DiscoveerNFT has key, store {
        id: UID,
        name: String,
        description: String,
        url: Url,
        creator: address,
        collection: String,
        attributes: vector<Attribute>,
    }

    // NFT Collection registry
    struct Collection has key {
        id: UID,
        name: String,
        creator: address,
        minted: u64,
        max_supply: u64,
    }

    // Attribute for NFT metadata
    struct Attribute has store, drop, copy {
        trait_type: String,
        value: String,
    }

    // Events
    struct NFTMinted has copy, drop {
        object_id: ID,
        creator: address,
        name: String,
        collection: String,
    }

    struct NFTTransferred has copy, drop {
        object_id: ID,
        from: address,
        to: address,
        timestamp: u64,
    }

    struct NFTBurned has copy, drop {
        object_id: ID,
        owner: address,
    }

    // Module initializer
    fun init(otw: NFT, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"url"),
            string::utf8(b"image_url"),
            string::utf8(b"creator"),
            string::utf8(b"collection"),
        ];

        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"{url}"),
            string::utf8(b"{url}"),
            string::utf8(b"{creator}"),
            string::utf8(b"{collection}"),
        ];

        let publisher = package::claim(otw, ctx);

        let display = display::new_with_fields<DiscoveerNFT>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    // Create a new NFT collection
    public entry fun create_collection(
        name: vector<u8>,
        max_supply: u64,
        ctx: &mut TxContext
    ) {
        let collection = Collection {
            id: object::new(ctx),
            name: string::utf8(name),
            creator: tx_context::sender(ctx),
            minted: 0,
            max_supply,
        };

        transfer::share_object(collection);
    }

    // Mint a new NFT
    public entry fun mint_nft(
        collection: &mut Collection,
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == collection.creator, ENotOwner);
        assert!(collection.minted < collection.max_supply, EInvalidCollection);

        let nft_id = object::new(ctx);
        let nft_id_copy = object::uid_to_inner(&nft_id);

        let nft = DiscoveerNFT {
            id: nft_id,
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url),
            creator: sender,
            collection: collection.name,
            attributes: vector::empty(),
        };

        collection.minted = collection.minted + 1;

        event::emit(NFTMinted {
            object_id: nft_id_copy,
            creator: sender,
            name: nft.name,
            collection: nft.collection,
        });

        transfer::public_transfer(nft, recipient);
    }

    // Mint NFT with attributes
    public entry fun mint_nft_with_attributes(
        collection: &mut Collection,
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        trait_types: vector<vector<u8>>,
        values: vector<vector<u8>>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == collection.creator, ENotOwner);
        assert!(collection.minted < collection.max_supply, EInvalidCollection);
        assert!(vector::length(&trait_types) == vector::length(&values), EInvalidMetadata);

        let nft_id = object::new(ctx);
        let nft_id_copy = object::uid_to_inner(&nft_id);

        let attributes = vector::empty<Attribute>();
        let i = 0;
        let len = vector::length(&trait_types);
        
        while (i < len) {
            let attribute = Attribute {
                trait_type: string::utf8(*vector::borrow(&trait_types, i)),
                value: string::utf8(*vector::borrow(&values, i)),
            };
            vector::push_back(&mut attributes, attribute);
            i = i + 1;
        };

        let nft = DiscoveerNFT {
            id: nft_id,
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url),
            creator: sender,
            collection: collection.name,
            attributes,
        };

        collection.minted = collection.minted + 1;

        event::emit(NFTMinted {
            object_id: nft_id_copy,
            creator: sender,
            name: nft.name,
            collection: nft.collection,
        });

        transfer::public_transfer(nft, recipient);
    }

    // Transfer NFT to another address
    public entry fun transfer_nft(
        nft: DiscoveerNFT,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let nft_id = object::id(&nft);

        event::emit(NFTTransferred {
            object_id: nft_id,
            from: sender,
            to: recipient,
            timestamp: 0, // In production, use Clock
        });

        transfer::public_transfer(nft, recipient);
    }

    // Transfer multiple NFTs in one transaction
    public entry fun batch_transfer_nfts(
        nfts: vector<DiscoveerNFT>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let i = 0;
        let len = vector::length(&nfts);

        while (i < len) {
            let nft = vector::pop_back(&mut nfts);
            let nft_id = object::id(&nft);

            event::emit(NFTTransferred {
                object_id: nft_id,
                from: sender,
                to: recipient,
                timestamp: 0,
            });

            transfer::public_transfer(nft, recipient);
            i = i + 1;
        };

        vector::destroy_empty(nfts);
    }

    // Burn an NFT
    public entry fun burn_nft(nft: DiscoveerNFT, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let nft_id = object::id(&nft);

        event::emit(NFTBurned {
            object_id: nft_id,
            owner: sender,
        });

        let DiscoveerNFT { id, name: _, description: _, url: _, creator: _, collection: _, attributes: _ } = nft;
        object::delete(id);
    }

    // View functions
    public fun get_nft_name(nft: &DiscoveerNFT): String {
        nft.name
    }

    public fun get_nft_description(nft: &DiscoveerNFT): String {
        nft.description
    }

    public fun get_nft_url(nft: &DiscoveerNFT): Url {
        nft.url
    }

    public fun get_nft_creator(nft: &DiscoveerNFT): address {
        nft.creator
    }

    public fun get_nft_collection(nft: &DiscoveerNFT): String {
        nft.collection
    }

    public fun get_nft_attributes(nft: &DiscoveerNFT): &vector<Attribute> {
        &nft.attributes
    }

    public fun get_collection_minted(collection: &Collection): u64 {
        collection.minted
    }

    public fun get_collection_max_supply(collection: &Collection): u64 {
        collection.max_supply
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(NFT {}, ctx)
    }
}