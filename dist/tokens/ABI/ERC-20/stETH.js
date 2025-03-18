export default [
    {
        constant: true,
        name: 'submit',
        inputs: [
            {
                name: '_referral',
                type: 'address',
            },
        ],
        outputs: [
            {
                name: 'shares',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
];
//# sourceMappingURL=stETH.js.map