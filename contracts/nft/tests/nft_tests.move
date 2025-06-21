#[test_only]
module discoveer_nft::nft_tests {
    use discoveer_nft::nft::{Self, DiscoveerNFT, Collection};
    use sui::test_scenario;
    use std::string;
    use std::vector;

    const ALICE: address = @0xA;
    const BOB: address = @0xB;
    const CHARLIE: address = @0xC;

    #[test]
    fun test_create_collection() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        // Create a collection
        test_scenario::next_tx(scenario, ALICE);
        {
            nft::create_collection(b"Discoveer Collection", 100, test_scenario::ctx(scenario));
        };

        // Verify collection was created
        test_scenario::next_tx(scenario, ALICE);
        {
            let collection = test_scenario::take_shared<Collection>(scenario);
            assert!(nft::get_collection_max_supply(&collection) == 100, 0);
            assert!(nft::get_collection_minted(&collection) == 0, 0);
            test_scenario::return_shared(collection);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_mint_nft() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        // Initialize module
        nft::init_for_testing(test_scenario::ctx(scenario));

        // Create collection
        test_scenario::next_tx(scenario, ALICE);
        {
            nft::create_collection(b"Test Collection", 10, test_scenario::ctx(scenario));
        };

        // Mint NFT
        test_scenario::next_tx(scenario, ALICE);
        {
            let collection = test_scenario::take_shared<Collection>(scenario);
            nft::mint_nft(
                &mut collection,
                b"Test NFT #1",
                b"This is a test NFT",
                b"https://example.com/nft1.png",
                BOB,
                test_scenario::ctx(scenario)
            );
            assert!(nft::get_collection_minted(&collection) == 1, 0);
            test_scenario::return_shared(collection);
        };

        // Verify Bob received the NFT
        test_scenario::next_tx(scenario, BOB);
        {
            let nft = test_scenario::take_from_sender<DiscoveerNFT>(scenario);
            assert!(nft::get_nft_name(&nft) == string::utf8(b"Test NFT #1"), 0);
            assert!(nft::get_nft_creator(&nft) == ALICE, 0);
            test_scenario::return_to_sender(scenario, nft);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_mint_nft_with_attributes() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        nft::init_for_testing(test_scenario::ctx(scenario));

        // Create collection
        test_scenario::next_tx(scenario, ALICE);
        {
            nft::create_collection(b"Attribute Collection", 10, test_scenario::ctx(scenario));
        };

        // Mint NFT with attributes
        test_scenario::next_tx(scenario, ALICE);
        {
            let collection = test_scenario::take_shared<Collection>(scenario);
            let trait_types = vector[b"Rarity", b"Color", b"Power"];
            let values = vector[b"Legendary", b"Gold", b"100"];
            
            nft::mint_nft_with_attributes(
                &mut collection,
                b"Legendary NFT",
                b"A legendary NFT with attributes",
                b"https://example.com/legendary.png",
                trait_types,
                values,
                BOB,
                test_scenario::ctx(scenario)
            );
            test_scenario::return_shared(collection);
        };

        // Verify attributes
        test_scenario::next_tx(scenario, BOB);
        {
            let nft = test_scenario::take_from_sender<DiscoveerNFT>(scenario);
            let attributes = nft::get_nft_attributes(&nft);
            assert!(std::vector::length(attributes) == 3, 0);
            test_scenario::return_to_sender(scenario, nft);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_transfer_nft() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        nft::init_for_testing(test_scenario::ctx(scenario));

        // Create collection and mint NFT to Bob
        test_scenario::next_tx(scenario, ALICE);
        {
            nft::create_collection(b"Transfer Test", 10, test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, ALICE);
        {
            let collection = test_scenario::take_shared<Collection>(scenario);
            nft::mint_nft(
                &mut collection,
                b"Transferable NFT",
                b"This NFT will be transferred",
                b"https://example.com/transfer.png",
                BOB,
                test_scenario::ctx(scenario)
            );
            test_scenario::return_shared(collection);
        };

        // Bob transfers NFT to Charlie
        test_scenario::next_tx(scenario, BOB);
        {
            let nft = test_scenario::take_from_sender<DiscoveerNFT>(scenario);
            nft::transfer_nft(nft, CHARLIE, test_scenario::ctx(scenario));
        };

        // Verify Charlie received the NFT
        test_scenario::next_tx(scenario, CHARLIE);
        {
            let nft = test_scenario::take_from_sender<DiscoveerNFT>(scenario);
            assert!(nft::get_nft_name(&nft) == string::utf8(b"Transferable NFT"), 0);
            test_scenario::return_to_sender(scenario, nft);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_batch_transfer() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        nft::init_for_testing(test_scenario::ctx(scenario));

        // Create collection
        test_scenario::next_tx(scenario, ALICE);
        {
            nft::create_collection(b"Batch Collection", 10, test_scenario::ctx(scenario));
        };

        // Mint multiple NFTs to Bob
        test_scenario::next_tx(scenario, ALICE);
        {
            let collection = test_scenario::take_shared<Collection>(scenario);
            let i = 0;
            while (i < 3) {
                nft::mint_nft(
                    &mut collection,
                    b"Batch NFT",
                    b"NFT for batch transfer",
                    b"https://example.com/batch.png",
                    BOB,
                    test_scenario::ctx(scenario)
                );
                i = i + 1;
            };
            test_scenario::return_shared(collection);
        };

        // Bob batch transfers all NFTs to Charlie
        test_scenario::next_tx(scenario, BOB);
        {
            let nfts = vector::empty<DiscoveerNFT>();
            let i = 0;
            while (i < 3) {
                let nft = test_scenario::take_from_sender<DiscoveerNFT>(scenario);
                vector::push_back(&mut nfts, nft);
                i = i + 1;
            };
            
            nft::batch_transfer_nfts(nfts, CHARLIE, test_scenario::ctx(scenario));
        };

        // Verify Charlie received all NFTs
        test_scenario::next_tx(scenario, CHARLIE);
        {
            let ids = test_scenario::ids_for_sender<DiscoveerNFT>(scenario);
            assert!(vector::length(&ids) == 3, 0);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_burn_nft() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        nft::init_for_testing(test_scenario::ctx(scenario));

        // Create collection and mint NFT
        test_scenario::next_tx(scenario, ALICE);
        {
            nft::create_collection(b"Burn Test", 10, test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, ALICE);
        {
            let collection = test_scenario::take_shared<Collection>(scenario);
            nft::mint_nft(
                &mut collection,
                b"Burnable NFT",
                b"This NFT will be burned",
                b"https://example.com/burn.png",
                BOB,
                test_scenario::ctx(scenario)
            );
            test_scenario::return_shared(collection);
        };

        // Bob burns the NFT
        test_scenario::next_tx(scenario, BOB);
        {
            let nft = test_scenario::take_from_sender<DiscoveerNFT>(scenario);
            nft::burn_nft(nft, test_scenario::ctx(scenario));
        };

        // Verify NFT was burned
        test_scenario::next_tx(scenario, BOB);
        {
            let ids = test_scenario::ids_for_sender<DiscoveerNFT>(scenario);
            assert!(vector::length(&ids) == 0, 0);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = nft::ENotOwner)]
    fun test_mint_unauthorized() {
        let scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        // Create collection as Alice
        test_scenario::next_tx(scenario, ALICE);
        {
            nft::create_collection(b"Alice Collection", 10, test_scenario::ctx(scenario));
        };

        // Bob tries to mint (should fail)
        test_scenario::next_tx(scenario, BOB);
        {
            let collection = test_scenario::take_shared<Collection>(scenario);
            nft::mint_nft(
                &mut collection,
                b"Unauthorized NFT",
                b"This should fail",
                b"https://example.com/fail.png",
                BOB,
                test_scenario::ctx(scenario)
            );
            test_scenario::return_shared(collection);
        };

        test_scenario::end(scenario_val);
    }
}