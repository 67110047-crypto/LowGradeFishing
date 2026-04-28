export const ITEM_WEAPON_ADDRESS = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

export const ITEM_WEAPON_ABI = [
  "function mintWeapon(address to, string itemName, string description, string image) public",
  "function getMyWeapons() public view returns (tuple(string itemName, string description, string image, bool isUsed, address owner)[])",
  "function markAsUsed(uint256 tokenId) public",
  "function useWeapon(uint256 tokenId) public",
  "function getWeapon(uint256 tokenId) public view returns (tuple(string itemName, string description, string image, bool isUsed, address owner))"
];
