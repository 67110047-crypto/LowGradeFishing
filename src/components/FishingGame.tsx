import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'motion/react';
import { Minigame } from './Minigame';
import { ITEM_WEAPON_ADDRESS, ITEM_WEAPON_ABI } from '../contracts/ItemWeapon';
import { Anchor, HelpCircle, Coins, Trash2, Fish, Wallet, AlertTriangle, Store, ArrowRightLeft } from 'lucide-react';

const BACKGROUND_IMAGE = ""; // Paste Background image URL here
const ROD_IMAGE = ""; // Paste Rod image URL here

const RARITIES = [
  { 
    type: 'Trash', 
    rate: 60, 
    coins: 1, 
    filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 1))', 
    color: 'text-gray-300', 
    name: 'Common Catch',
    imageUrls: ["https://res.cloudinary.com/doi1go8uu/image/upload/v1777379399/6_upwljd.png"]
  },
  { 
    type: 'Rare', 
    rate: 30, 
    coins: 5, 
    filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 1))', 
    color: 'text-blue-400', 
    name: 'Rare Catch',
    imageUrls: [
      "https://res.cloudinary.com/doi1go8uu/image/upload/v1777379403/1_mkshx6.png",
      "https://res.cloudinary.com/doi1go8uu/image/upload/v1777379398/4_k1g5hg.png"
    ]
  },
  { 
    type: 'Epic', 
    rate: 15, 
    coins: 20, 
    filter: 'drop-shadow(0 0 40px rgba(168, 85, 247, 1))', 
    color: 'text-purple-400', 
    name: 'Epic Catch',
    imageUrls: [
      "https://res.cloudinary.com/doi1go8uu/image/upload/v1777379399/3_bz8mf7.png",
      "https://res.cloudinary.com/doi1go8uu/image/upload/v1777379401/2_lmkfiu.png"
    ]
  },
  { 
    type: 'Legendary', 
    rate: 5, 
    coins: 100, 
    filter: 'drop-shadow(0 0 50px rgba(234, 179, 8, 1))', 
    color: 'text-yellow-400', 
    name: 'Legendary Treasure',
    imageUrls: [
      "https://res.cloudinary.com/doi1go8uu/image/upload/v1777379398/5_cxbjya.png"
    ]
  }
];

const RODS = [
  { id: 0, name: "Starter Rod", price: 0, color: "bg-slate-800", shadow: "", shopImage: "https://res.cloudinary.com/doi1go8uu/image/upload/v1777378663/1_g7hcuh.png", stageImage: "https://res.cloudinary.com/doi1go8uu/image/upload/v1777379940/Untitled1658_20260428193112_kddnma.png" },
  { id: 1, name: "Fiberglass Rod", price: 10, color: "bg-blue-600", shadow: "shadow-[0_0_15px_rgba(37,99,235,0.5)]", shopImage: "https://res.cloudinary.com/doi1go8uu/image/upload/v1777378664/2_mtdwbh.png", stageImage: "https://res.cloudinary.com/doi1go8uu/image/upload/v1777380259/Untitled1658_20260428193340_tkzppd.png" },
  { id: 2, name: "Carbon Pro Rod", price: 50, color: "bg-zinc-800", shadow: "shadow-[0_0_20px_rgba(0,0,0,0.8)]", shopImage: "https://res.cloudinary.com/doi1go8uu/image/upload/v1777378662/3_yzsxmr.png", stageImage: "https://res.cloudinary.com/doi1go8uu/image/upload/v1777380259/Untitled1658_20260428194233_ri662q.png" },
  { id: 3, name: "Golden Rod", price: 200, color: "bg-yellow-400", shadow: "shadow-[0_0_25px_rgba(250,204,21,0.8)]", shopImage: "https://res.cloudinary.com/doi1go8uu/image/upload/v1777378669/4_s27rub.png", stageImage: "https://res.cloudinary.com/doi1go8uu/image/upload/v1777380646/Untitled1658_20260428194825_cus5ci.png" }
];

type GameState = 'START' | 'WAITING' | 'MINIGAME' | 'RESULT' | 'MINTING';

export default function FishingGame() {
  const [wallet, setWallet] = useState<{ provider: any; signer: any; address: string } | null>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [coins, setCoins] = useState(0);
  const [catchResult, setCatchResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showShop, setShowShop] = useState(false);
  const [shopTab, setShopTab] = useState<'RODS' | 'EXCHANGE'>('RODS');
  const [ownedRods, setOwnedRods] = useState<number[]>([0]);
  const [currentRod, setCurrentRod] = useState<number>(0);

  useEffect(() => {
    // Attempt auto connect if previously connected
    if ((window as any).ethereum) {
      (window as any).ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      }).catch(console.error);
    }
  }, []);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        const network = await provider.getNetwork();
        if (network.chainId !== 31337n) {
          setErrorMsg("Please switch Metamask to localhost (chainId 31337)");
          return;
        }
        
        setWallet({ provider, signer, address });
        setErrorMsg("");
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to connect wallet.");
      }
    } else {
      setErrorMsg("Please install Metamask. The game requires a Web3 wallet on localhost:31337.");
    }
  };

  const startFishing = () => {
    setGameState('WAITING');
    setErrorMsg("");
    
    // Random wait time before bite (2 to 4 seconds)
    const waitTime = 2000 + Math.random() * 2000;
    setTimeout(() => {
      setGameState('MINIGAME');
    }, waitTime);
  };

  const handleWin = () => {
    // Generate catch based on probabilities (110 total from 60+30+15+5)
    const roll = Math.random() * 110;
    let rarityIndex;
    if (roll <= 60) rarityIndex = 0;
    else if (roll <= 90) rarityIndex = 1;
    else if (roll <= 105) rarityIndex = 2;
    else rarityIndex = 3;
    
    const selectedRarity = RARITIES[rarityIndex];
    const imageUrl = selectedRarity.imageUrls[Math.floor(Math.random() * selectedRarity.imageUrls.length)];
    const result = { ...selectedRarity, imageUrl };
    
    setCatchResult(result);
    setGameState('RESULT');
  };

  const handleLose = () => {
    setGameState('START');
    setErrorMsg("The fish escaped! Try again.");
    setTimeout(() => setErrorMsg(""), 3000);
  };

  const claimCatch = async () => {
    if (!catchResult) return;
    setGameState('MINTING');
    setErrorMsg("");
    
    if (!wallet) {
      // Mock minting if testing without wallet
      setTimeout(() => {
         setCoins(prev => prev + catchResult.coins);
         setGameState('START');
         setCatchResult(null);
      }, 1500);
      return;
    }

    try {
      const contract = new ethers.Contract(ITEM_WEAPON_ADDRESS, ITEM_WEAPON_ABI, wallet.signer);
      // Construct a unique IPFS URL dummy pattern to pass the require(!imageMinted[image])
      // Using a local timestamp avoids collisions since the contract locks uniqueness
      const uniqueUrl = `ipfs://${catchResult.type.toLowerCase()}_${Date.now()}`;
      
      const tx = await contract.mintWeapon(
        wallet.address,
        catchResult.name,
        `A ${catchResult.type} item caught in the 2.5D Fishing Game`,
        uniqueUrl
      );
      
      await tx.wait(); // Wait for confirmation on localhost
      
      setCoins(prev => prev + catchResult.coins);
      setGameState('START');
      setCatchResult(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.reason || "Minting failed. Make sure your local node is running and you are on localhost 31337.");
      setGameState('RESULT'); // Return to result so they can retry
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden border-8 border-slate-900 mx-auto z-0 max-w-[1024px]">
      
      {/* Background Parallax / Scenery Simulation */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-sky-400 via-blue-500 to-blue-900">
         {/* Clouds */}
         <div className="absolute top-10 left-20 w-32 h-12 bg-white/20 rounded-full blur-xl"></div>
         <div className="absolute top-20 right-40 w-48 h-16 bg-white/20 rounded-full blur-xl"></div>
         {/* Water Surface */}
         <div className="absolute bottom-0 inset-x-0 h-2/3 bg-blue-600/30 backdrop-blur-[2px]">
           <div className="absolute top-0 w-full h-8 bg-white/10 opacity-50 skew-y-1"></div>
         </div>
      </div>

      {/* Header UI */}
      <nav className="h-16 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-20 absolute top-0 left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <img src="https://res.cloudinary.com/doi1go8uu/image/upload/v1777377433/%E0%B8%8A%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B9%80%E0%B8%81%E0%B8%A1_d2tqz6.png" alt="Game Logo" className="h-[50px] drop-shadow-md object-contain" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
            <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-slate-700/50">
               <Coins className="text-yellow-500" size={14} />
               <span className="text-sm font-black text-white">{coins} <span className="text-[10px] text-slate-400">IWP</span></span>
            </div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-mono">31337</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowShop(true)}
              className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-slate-700 shadow-lg"
            >
              <Store size={16} /> Shop
            </button>
            <button 
              onClick={wallet ? undefined : connectWallet}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg 
                ${wallet 
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 font-mono tracking-tighter' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'}`}
            >
              <Wallet size={16} />
              {wallet ? `${wallet.address.slice(0,6)}...${wallet.address.slice(-4)}` : 'Connect'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Game Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative mt-16 z-10">
        
        {/* Equipped Rod Display */}
        <div className="absolute left-6 top-6 bg-slate-900/80 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-sm hidden sm:flex flex-col items-center w-24">
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 text-center w-full border-b border-slate-700/50 pb-1">Equipped</span>
           <img src={RODS[currentRod].shopImage} alt={RODS[currentRod].name} className="w-16 h-16 object-contain drop-shadow-lg" />
           <span className="text-[10px] text-white font-bold text-center mt-2 leading-tight">{RODS[currentRod].name}</span>
        </div>
        
        {/* Error Messages */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-16 bg-red-900/90 text-red-200 px-6 py-3 rounded-full flex items-center gap-2 border border-red-500 shadow-xl"
            >
              <AlertTriangle size={18} />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* State rendering */}
        {gameState === 'START' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center z-20 relative"
          >
           <button 
             onClick={startFishing}
             className="relative group bg-white hover:bg-slate-200 text-slate-900 text-2xl font-black py-4 px-12 rounded-xl shadow-lg shadow-white/10 transition-all active:scale-95 mb-4 uppercase tracking-tighter"
           >
             CAST LINE
           </button>
           {!wallet && <p className="text-white/70 font-bold bg-slate-900/50 px-4 py-2 rounded-lg text-sm border border-slate-700 max-w-sm text-center">Playing in Demo Mode. Connect Metamask on localhost:31337 to mint actual NFTs.</p>}
          </motion.div>
        )}

        {gameState === 'WAITING' && (
          <div className="flex flex-col items-center justify-center relative w-full h-[400px] z-20">
            <motion.div 
               animate={{ y: [0, -10, 5, -5, 0] }}
               transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
               className="relative"
            >
              <img src={RODS[currentRod].stageImage} alt={RODS[currentRod].name} className="h-[300px] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]" />
            </motion.div>
            <p className="absolute bottom-0 text-white font-bold text-2xl drop-shadow-lg tracking-widest italic animate-pulse">WAITING...</p>
          </div>
        )}

        {gameState === 'MINIGAME' && (
          <motion.div
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
          >
             <Minigame onWin={handleWin} onLose={handleLose} />
          </motion.div>
        )}

        {gameState === 'RESULT' && catchResult && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center w-96 bg-slate-900 rounded-2xl border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] p-8 text-center relative z-20"
          >
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg mb-6">REEL IN SUCCESS!</h2>
            
            <div className="w-32 h-32 bg-white/5 rounded-2xl mx-auto mb-6 flex flex-col items-center justify-center border border-white/10 shadow-inner relative">
               <div className="absolute inset-0 rounded-2xl animate-pulse opacity-50 blur-xl" style={{ boxShadow: catchResult.filter }}></div>
               {/* Use the mapped icon */}
               <div style={{ filter: catchResult.filter }} className="relative z-10 transition-transform hover:scale-110 mb-2">
                 {catchResult.imageUrl ? (
                    <img src={catchResult.imageUrl} alt={catchResult.name} className="w-24 h-24 object-contain drop-shadow-2xl" crossOrigin="anonymous" />
                 ) : (
                    <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center">
                       <HelpCircle size={48} className="text-white/50" />
                    </div>
                 )}
               </div>
               <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider bg-slate-900/50 px-2 py-0.5 rounded backdrop-blur-sm relative z-20">
                 {catchResult.type}
               </span>
            </div>
            
            <h3 className={`text-xl font-bold mb-4 uppercase tracking-wide ${catchResult.color}`} style={{ textShadow: '0 2px 10px rgba(255,255,255,0.1)' }}>
              {catchResult.name}
            </h3>
            
            <div className="flex flex-col items-center bg-slate-800/80 w-full rounded-xl p-4 border border-slate-700/50 mb-6">
               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Items Found</span>
               <span className="text-yellow-400 font-black text-2xl flex items-center gap-1.5"><Coins size={20}/> +{catchResult.coins}</span>
            </div>

            <div className="flex flex-col gap-3 w-full">
               <button 
                 onClick={claimCatch}
                 className="w-full bg-white text-slate-900 rounded-xl font-black text-sm uppercase tracking-tighter hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 py-4 border border-white/50"
               >
                 Mint Weapon NFT
               </button>
               <button
                  onClick={() => setGameState('START')}
                  className="w-full bg-slate-800 text-white rounded-xl font-bold text-xs uppercase border border-slate-700 hover:bg-slate-700 transition-colors py-3"
               >
                  Discard Catch
               </button>
            </div>
          </motion.div>
        )}

        {gameState === 'MINTING' && (
          <div className="flex flex-col items-center bg-slate-900/90 p-12 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Minting NFT</h2>
            <p className="text-blue-300">Please confirm the transaction in Metamask...</p>
          </div>
        )}
      </div>

      {/* Shop Modal */}
      <AnimatePresence>
        {showShop && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-[500px] bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
            >
               <div className="flex border-b border-slate-700 relative z-10">
                 <button className={`flex-1 py-4 font-bold text-sm transition-colors ${shopTab === 'RODS' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`} onClick={() => setShopTab('RODS')}>
                   ROD SHOP
                 </button>
                 <button className={`flex-1 py-4 font-bold text-sm transition-colors ${shopTab === 'EXCHANGE' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`} onClick={() => setShopTab('EXCHANGE')}>
                   EXCHANGE
                 </button>
               </div>
               
               <div className="p-6 relative z-10">
                 {shopTab === 'RODS' && (
                   <div className="flex flex-col gap-3 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                     {RODS.map(rod => (
                       <div key={rod.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${currentRod === rod.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
                         <div className="flex items-center gap-4">
                           <img src={rod.shopImage} alt={rod.name} className="w-14 h-14 object-contain drop-shadow-md" />
                           <div>
                             <p className="font-bold text-white tracking-wide">{rod.name}</p>
                             <p className="text-sm text-yellow-400 font-mono">{rod.price} IWP</p>
                           </div>
                         </div>
                         {ownedRods.includes(rod.id) ? (
                           <button 
                             disabled={currentRod === rod.id}
                             onClick={() => setCurrentRod(rod.id)}
                             className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors ${currentRod === rod.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                           >
                             {currentRod === rod.id ? 'Equipped' : 'Equip'}
                           </button>
                         ) : (
                           <button 
                             onClick={() => {
                               if (coins >= rod.price) {
                                 setCoins(c => c - rod.price);
                                 setOwnedRods([...ownedRods, rod.id]);
                               } else {
                                 setErrorMsg("Not enough coins to buy this rod!");
                                 setTimeout(() => setErrorMsg(""), 3000);
                               }
                             }}
                             className={`px-6 py-2 rounded-lg font-bold text-xs uppercase shadow-lg transition-all ${coins >= rod.price ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                           >
                             Buy
                           </button>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
                 
                 {shopTab === 'EXCHANGE' && (
                   <div className="flex flex-col items-center justify-center h-[300px] text-center gap-6">
                     <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full shadow-inner">
                       <h3 className="text-xl font-bold text-white mb-2">Exchange IWP for ETH</h3>
                       <p className="text-sm text-slate-400 mb-8 font-mono">RATE: 10 IWP = 0.001 ETH</p>
                       
                       <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl p-4 mb-8 shadow-inner">
                          <div className="flex items-center gap-3">
                            <Coins className="text-yellow-400" size={28}/>
                            <span className="text-2xl font-bold text-white text-left">{coins}</span>
                          </div>
                          <ArrowRightLeft className="text-slate-500" />
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-2xl font-bold text-emerald-400">{(Math.floor(coins / 10) * 0.001).toFixed(3)}</span>
                            <span className="text-sm font-bold text-slate-400 font-mono">ETH</span>
                          </div>
                       </div>
                       
                       <button 
                         onClick={() => {
                           if (coins >= 10) {
                             const exchAmount = Math.floor(coins / 10) * 10;
                             setCoins(c => c - exchAmount);
                             setErrorMsg(`Successfully exchanged ${exchAmount} IWP for ETH (Simulated)`);
                             setTimeout(() => setErrorMsg(""), 4000);
                           } else {
                             setErrorMsg("Minimum 10 IWP required to exchange.");
                             setTimeout(() => setErrorMsg(""), 3000);
                           }
                         }}
                         className={`w-full py-4 rounded-xl font-black text-sm uppercase transition-all shadow-lg ${coins >= 10 ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_4px_0_theme(colors.emerald.700)] active:translate-y-1 active:shadow-none' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                       >
                         Exchange Now
                       </button>
                     </div>
                   </div>
                 )}
               </div>
               <button className="absolute top-4 right-4 text-slate-500 hover:text-white z-20 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors" onClick={() => setShowShop(false)}>
                 <span className="text-xl leading-none">&times;</span>
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
