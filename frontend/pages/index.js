import {
  EdmundoProjectDAOABI,
  EdmundoProjectNFTAddress,
  EdmundoProjectNFTABI,
  EdmundoProjectDAOAddress,
} from "@/constants";
import { http, createConfig, waitForTransactionReceipt, readContract } from '@wagmi/core'
import { sepolia } from '@wagmi/core/chains'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import Head from "next/head";
import { formatEther } from "viem/utils";

import styles from "../styles/Home.module.css";
import { Inter } from "next/font/google";

//insert config like at _app.js
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function Home() {
  // Check if the user's wallet is connected, and it's address using Wagmi's hooks.
  const { address, isConnected } = useAccount();
  const { connector } = useAccount(config);

  
  // State variable to know if the component has been mounted yet or not
  const [isMounted, setIsMounted] = useState(false);
  
  // State variable to show loading state when waiting for a transaction to go through
  const [loading, setLoading] = useState(false);
  
  const { writeContract } = useWriteContract(config);

  // Fake NFT Token ID to purchase. Used when creating a proposal.
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  // State variable to store all proposals in the DAO
  const [proposals, setProposals] = useState([]);
  // State variable to switch between the 'Create Proposal' and 'View Proposals' tabs
  const [selectedTab, setSelectedTab] = useState("");
  
  // Fetch the owner of the DAO
  const daoOwner = useReadContract({
    abi: EdmundoProjectDAOABI,
    address: EdmundoProjectDAOAddress,
    functionName: "owner",
  });
  
  // Fetch the balance of the DAO
  const daoBalance = useBalance({
    address: EdmundoProjectNFTAddress,
  });
  
  // Fetch the number of proposals in the DAO
  const numOfProposalsInDAO = useReadContract({
    abi: EdmundoProjectDAOABI,
    address: EdmundoProjectDAOAddress,
    functionName: "numProposals",
  });
  
  // Fetch the CryptoDevs NFT balance of the user
  const nftBalanceOfUser = useReadContract({
    abi: EdmundoProjectNFTABI,
    address: EdmundoProjectNFTAddress,
    functionName: "balanceOf",
    args: [address],
  });
  
  // Function to make a createProposal transaction in the DAO

  async function createProposal() {
    setLoading(true);
    try {      
      const tx = await writeContract({
        abi: EdmundoProjectDAOABI,
        address: EdmundoProjectDAOAddress,
        functionName: "createProposal",
        args: [fakeNftTokenId,],
      });
      
      //logging
      console.log(tx);

      const transactionReceipt = useWaitForTransactionReceipt({
        hash: tx,
      });
      console.log(transactionReceipt);
    } catch (error) {
      window.alert(error);
      console.log(error);

    }
    setLoading(false);
  }

  // Function to fetch a proposal by it's ID
  async function fetchProposalById(id) {

    // at new version to readContract need config
    try {
      const proposal = await readContract(config, {
        address: EdmundoProjectDAOAddress,
        abi: EdmundoProjectDAOABI,
        functionName: "proposals",
        args: [id],
      });

      const [nftTokenId, deadline, yayVotes, nayVotes, executed] = proposal;

      const parsedProposal = {
        proposalId: id,
        nftTokenId: nftTokenId.toString(),
        deadline: new Date(parseInt(deadline.toString()) * 1000),
        yayVotes: yayVotes.toString(),
        nayVotes: nayVotes.toString(),
        executed: Boolean(executed),
      };
      console.log('jalannn',connector.getProvider())


      return parsedProposal;
    } catch (error) {
      console.error(error);
      window.alert(error);
      console.log(parsedProposal)
    }
  }

  // Function to fetch all proposals in the DAO
  async function fetchAllProposals() {
    try {
      const proposals = [];

      for (let i = 0; i < numOfProposalsInDAO.data; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }

      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  // Function to vote YAY or NAY on a proposal
  async function voteForProposal(proposalId, vote) {
    setLoading(true);
    try {
      const tx = await writeContract(config, {
        address: EdmundoProjectDAOAddress,
        abi: EdmundoProjectDAOABI,
        functionName: "voteOnProposal",
        args: [proposalId, vote === "YAY" ? 0 : 1],
      });

      await waitForTransactionReceipt(config, {tx});
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  // Function to execute a proposal after deadline has been exceeded
  async function executeProposal(proposalId) {
    setLoading(true);
    try {
      const tx = await writeContract(config, {
        address: EdmundoProjectDAOAddress,
        abi: EdmundoProjectDAOABI,
        functionName: "executeProposal",
        args: [proposalId],
      });

      await waitForTransactionReceipt(config, {tx});
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  // Function to withdraw ether from the DAO contract
  async function withdrawDAOEther() {
    setLoading(true);
    try {
      const tx = await writeContract(config, {
        address: EdmundoProjectDAOAddress,
        abi: EdmundoProjectDAOABI,
        functionName: "withdrawEther",
        args: [],
      });

      await waitForTransactionReceipt(config, {tx});
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  // Render the contents of the appropriate tab based on `selectedTab`
  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  // Renders the 'Create Proposal' tab content
  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (nftBalanceOfUser.data === 0) {
      return (
        <div className={styles.description}>
          You do not own any Edmundo Project NFTs. <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>Fake NFT Token ID to Purchase: </label>
          <input
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          <button className={styles.button2} onClick={createProposal}>
            Create
          </button>
        </div>
      );
    }
  }

  // Renders the 'View Proposals' tab content
  function renderViewProposalsTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>No proposals have been created</div>
      );
    } else {
      return (
        <div>
          {proposals.map((p, index) => (
            <div key={index} className={styles.card}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>Fake NFT to Purchase: {p.nftTokenId}</p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Yay Votes: {p.yayVotes}</p>
              <p>Nay Votes: {p.nayVotes}</p>
              <p>Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => voteForProposal(p.proposalId, "YAY")}
                  >
                    Vote YAY
                  </button>
                  <button
                    className={styles.button2}
                    onClick={() => voteForProposal(p.proposalId, "NAY")}
                  >
                    Vote NAY
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => executeProposal(p.proposalId)}
                  >
                    Execute Proposal{" "}
                    {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>Proposal Executed</div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  // Piece of code that runs everytime the value of `selectedTab` changes
  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'View Proposals' tab
  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (!isConnected)
    return (
      <div>
        <ConnectButton />
      </div>
    );

  return (
    <div className={inter.className}>
      <Head>
        <title>Edmundo Project</title>
        <meta name="description" content="Edmundo Project DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Edmundo Project!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your Edmundo Project NFT Balance: {nftBalanceOfUser.data?.toString()}
            <br />
            {daoBalance.data && (
              <>
                Treasury Balance:{" "}
                {formatEther(daoBalance.data.value).toString()} ETH
              </>
            )}
            <br />
            Total Number of Proposals: {numOfProposalsInDAO.data?.toString()}
          </div>
          <div className={styles.flex}>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("Create Proposal")}
            >
              Create Proposal
            </button>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
          {/* Display additional withdraw button if connected wallet is owner */}
          {address && address.toLowerCase() === daoOwner.data?.toLowerCase() ? (
            <div>
              {loading ? (
                <button className={styles.button}>Loading...</button>
              ) : (
                <button className={styles.button} onClick={withdrawDAOEther}>
                  Withdraw DAO ETH
                </button>
              )}
            </div>
          ) : (
            ""
          )}
        </div>
        <div>
          <img className={styles.image} src="https://i.imgur.com/buNhbF7.png" />
        </div>
      </div>
    </div>
  );
}