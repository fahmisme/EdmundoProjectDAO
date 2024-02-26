// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract EdmundoProjectNFT is ERC721Enumerable {
    constructor() ERC721("EdmundoProjectNFT", "EdPN"){}

    function mint() public {
        _safeMint(msg.sender, totalSupply());
    }
}