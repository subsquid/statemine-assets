import { lookupArchive } from "@subsquid/archive-registry";
import { SubstrateProcessor } from "@subsquid/substrate-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";
// import { assetAccountFrozen, assetBalanceBurned, assetBalanceThawed, assetCreated, assetDestroyed, assetFrozen, assetMetadataSet, assetMetadataCleared, assetOwnerChanged, assetTeamChanged, assetThawed, assetTransfer, balancesTransfer, transferFee, uniqueClassCreated, uniqueClassDestroyed, uniqueClassFrozen, uniqueClassThawed, uniqueInstanceBurned, uniqueInstanceFrozen, uniqueInstanceIssued, uniqueInstanceThawed, uniqueInstanceTransferred, uniquesMetadataSet, uniquesMetadataCleared } from "./mappings";
import * as mappings from "./mappings"

// const processor = new substrateProcessor.SubstrateProcessor('statemine_balances');

const database = new TypeormDatabase();
const processor = new SubstrateProcessor(database)
/* processor.setDataSource({
	archive: 'https://kusama.archive.subsquid.io/graphql',
	chain: 'wss://statemine-rpc.polkadot.io'
}) */
processor.setBatchSize(500);

processor.setDataSource({
    archive: 'https://statemine.archive.subsquid.io/graphql', 
	// archive: lookupArchive("statemine", { release: "FireSquid" }),
    chain: 'wss://statemine-rpc.polkadot.io'
})

// processor.setBlockRange({from: 66725});  TODO: FATAL ERROR

processor.addEventHandler('Balances.Transfer', mappings.balancesTransfer);
processor.addEventHandler('Balances.Deposit', mappings.transferFee);
processor.addEventHandler('Assets.Created', mappings.assetCreated);
processor.addEventHandler('Assets.AssetFrozen', mappings.assetFrozen);
processor.addEventHandler('Assets.AssetThawed', mappings.assetThawed);
processor.addEventHandler('Assets.Destroyed', mappings.assetDestroyed);
processor.addEventHandler('Assets.OwnerChanged', mappings.assetOwnerChanged);
processor.addEventHandler('Assets.TeamChanged', mappings.assetTeamChanged);
processor.addEventHandler('Assets.MetadataSet', mappings.assetMetadataSet);
processor.addEventHandler('Assets.MetadataCleared', mappings.assetMetadataCleared);
processor.addEventHandler('Assets.Transferred', mappings.assetTransfer);
processor.addEventHandler('Assets.TransferredApproved', mappings.assetTransfer);
processor.addEventHandler('Assets.Frozen', mappings.assetAccountFrozen);
processor.addEventHandler('Assets.Burned', mappings.assetBalanceBurned);
processor.addEventHandler('Assets.Thawed', mappings.assetBalanceThawed);
processor.addEventHandler('Uniques.Created', mappings.uniqueClassCreated);
processor.addEventHandler('Uniques.Issued', mappings.uniqueInstanceIssued);
processor.addEventHandler('Uniques.Destroyed', mappings.uniqueClassDestroyed);
processor.addEventHandler('Uniques.Transferred', mappings.uniqueInstanceTransferred);
processor.addEventHandler('Uniques.Burned', mappings.uniqueInstanceBurned);
processor.addEventHandler('Uniques.Frozen', mappings.uniqueInstanceFrozen);
processor.addEventHandler('Uniques.Thawed', mappings.uniqueInstanceThawed);
processor.addEventHandler('Uniques.ClassFrozen', mappings.uniqueClassFrozen);
processor.addEventHandler('Uniques.ClassThawed', mappings.uniqueClassThawed);
// processor.addEventHandler('Uniques.CollectionMetadataSet', mappings.uniquesCollectionMetadataSet);
// processor.addEventHandler('Uniques.CollectionMetadataCleared', mappings.uniquesCollectionMetadataCleared);
processor.addEventHandler('Uniques.MetadataSet', mappings.uniquesMetadataSet);
processor.addEventHandler('Uniques.MetadataCleared', mappings.uniquesMetadataCleared);
processor.addEventHandler('Uniques.TeamChanged', mappings.uniquesTeamChanged);
processor.addEventHandler('Uniques.OwnerChanged', mappings.uniquesOwnerChanged);
// processor.addEventHandler('Uniques.AttributeSet', mappings.uniquesAttributeSet);
processor.addEventHandler('Uniques.AttributeCleared', mappings.uniquesAttributeCleared);


processor.run();

interface TransferEvent {
	from: Uint8Array;
	to: Uint8Array;
	amount: bigint;
}

/* npx squid-substrate-metadata-explorer \
--chain wss://statemine-rpc.polkadot.io \
--archive https://statemine.archive.subsquid.io/graphql \
--out statemineVersions.jsonl */





