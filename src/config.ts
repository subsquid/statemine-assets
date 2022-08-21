const config = {
    chainName: 'statemine',
    prefix: 'statemine',
    dataSource: {
        archive: 'https://statemine.archive.subsquid.io/graphql',
        chain: 'wss://statemine-rpc.polkadot.io',
    },
    typesBundle: 'statemine',
    batchSize: 500,
    /*blockRange: {
        from: 0,
    }, */
}

export default config