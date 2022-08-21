import { BatchContext, BatchProcessorEventItem, BatchProcessorItem, EventHandlerContext, SubstrateBatchProcessor, SubstrateEvent } from "@subsquid/substrate-processor";
import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
// import { saveAll } from "./bufferCache";
import * as mappings from "./mappings"

const processor = new SubstrateBatchProcessor()

processor.setBatchSize(500);
processor.setDataSource({
    archive: 'https://statemine.archive.subsquid.io/graphql', 
    chain: 'wss://statemine-rpc.polkadot.io'
})

// processor.setBlockRange({from: 338599});		///ERROR AT BLOCK 338600 - no class created before metadataset

processor.addEvent('Assets.Created', {
	data: {event: true}
} as const);
processor.addEvent('Assets.AssetFrozen', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.AssetThawed', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.Destroyed', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.OwnerChanged', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.TeamChanged', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.MetadataSet', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.MetadataCleared', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.Transferred', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.TransferredApproved', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.Frozen', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.Burned', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Assets.Thawed', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.Created', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.Issued', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.Destroyed', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.Transferred', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.Burned', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.Frozen', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.Thawed', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.ClassFrozen', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.ClassThawed', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.CollectionMetadataSet', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.CollectionMetadataCleared', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.ClassMetadataSet', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.ClassMetadataCleared', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.MetadataSet', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.MetadataCleared', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.TeamChanged', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.OwnerChanged', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.AttributeSet', {
	data: {event: {args: true}}
} as const);
processor.addEvent('Uniques.AttributeCleared', {
	data: {event: {args: true}}
} as const);

type Item = BatchProcessorItem<typeof processor>
export type Context = BatchContext<Store, Item>

// processor.run(new TypeormDatabase(), async (ctx) => {
// 	process(ctx);
// 	// await saveAll(ctx.store);
// });
processor.run(new TypeormDatabase(), process);

async function process(ctx1: Context): Promise<void> {
	for (const block of ctx1.blocks) {
		for (const item of block.items) {
			if (item.kind === 'event') {
				let ctxHelp = {...ctx1, block: block.header, event: item.event as SubstrateEvent}
				let {blocks, ...ctx} = ctxHelp;
				await processEventItems(ctx)
			}
		}
	}
}

async function processEventItems(ctx: EventHandlerContext<Store, {event: true}>) {
	switch (ctx.event.name) {
		case 'Assets.Created': {
			await mappings.assetCreated(ctx);
			break;
		}
		case 'Assets.AssetFrozen': {
			await mappings.assetFrozen(ctx);
			break;
		}
		case 'Assets.AssetThawed': {
			await mappings.assetThawed(ctx);
			break;
		}
		case 'Assets.Destroyed': {
			await mappings.assetDestroyed(ctx);
			break;
		}
		case 'Assets.OwnerChanged': {
			await mappings.assetOwnerChanged(ctx);
			break;
		}
		case 'Assets.TeamChanged': {
			await mappings.assetTeamChanged(ctx);
			break;
		}
		case 'Assets.MetadataSet': {
			await mappings.assetMetadataSet(ctx);
			break;
		}
		case 'Assets.MetadataCleared': {
			await mappings.assetMetadataCleared(ctx);
			break;
		}
		case 'Assets.Transferred': {
			await mappings.assetTransfer(ctx);
			break;
		}
		case 'Assets.TransferredApproved': {
			await mappings.assetTransferredApproved(ctx);
			break;
		}
		case 'Assets.Frozen': {
			await mappings.assetAccountFrozen(ctx);
			break;
		}
		case 'Assets.Burned': {
			await mappings.assetBalanceBurned(ctx);
			break;
		}
		case 'Assets.Thawed': {
			await mappings.assetBalanceThawed(ctx);
			break;
		}
		case 'Uniques.Created': {
			await mappings.uniqueClassCreated(ctx);
			break;
		}
		case 'Uniques.Issued': {
			await mappings.uniqueInstanceIssued(ctx);
			break;
		}
		case 'Uniques.Destroyed': {
			await mappings.uniqueClassDestroyed(ctx);
			break;
		}
		case 'Uniques.Transferred': {
			await mappings.uniqueInstanceTransferred(ctx);
			break;
		}
		case 'Uniques.Burned': {
			await mappings.uniqueInstanceBurned(ctx);
			break;
		}
		case 'Uniques.Frozen': {
			await mappings.uniqueInstanceFrozen(ctx);
			break;
		}
		case 'Uniques.Thawed': {
			await mappings.uniqueInstanceThawed(ctx);
			break;
		}
		case 'Uniques.ClassFrozen': {
			await mappings.uniqueClassFrozen(ctx);
			break;
		}
		case 'Uniques.ClassThawed': {
			await mappings.uniqueClassThawed(ctx);
			break;
		}
		case 'Uniques.CollectionMetadataSet': {
			await mappings.uniquesCollectionMetadataSet(ctx);
			break;
		}
		case 'Uniques.CollectionMetadataCleared': {
			await mappings.uniquesCollectionMetadataCleared(ctx);
			break;
		}
		case 'Uniques.ClassMetadataSet': {
			await mappings.uniquesClassMetadataSet(ctx);
			break;
		}
		case 'Uniques.ClassMetadataCleared': {
			await mappings.uniquesClassMetadataCleared(ctx);
			break;
		}
		case 'Uniques.MetadataSet': {
			await mappings.uniquesMetadataSet(ctx);
			break;
		}
		case 'Uniques.MetadataCleared': {
			await mappings.uniquesMetadataCleared(ctx);
			break;
		}
		case 'Uniques.TeamChanged': {
			await mappings.uniquesTeamChanged(ctx);
			break;
		}
		case 'Uniques.OwnerChanged': {
			await mappings.uniquesOwnerChanged(ctx);
			break;
		}
		case 'Uniques.AttributeSet': {
			await mappings.uniquesAttributeSet(ctx);
			break;
		}
		case 'Uniques.AttributeCleared': {
			await mappings.uniquesAttributeCleared(ctx);
			break;
		}
	}
}