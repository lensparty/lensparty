import { Button } from '@components/UI/Button';
import { Spinner } from '@components/UI/Spinner';
import useBroadcast from '@components/utils/hooks/useBroadcast';
import { UserRemoveIcon } from '@heroicons/react/outline';
import getSignature from '@lib/getSignature';
import onError from '@lib/onError';
import splitSignature from '@lib/splitSignature';
import { FollowNFT } from 'abis';
import { RELAY_ON, SIGN_WALLET } from 'data/constants';
import type { Signer } from 'ethers';
import { Contract } from 'ethers';
import type { CreateBurnEip712TypedData, Profile } from 'lens';
import { useCreateUnfollowTypedDataMutation } from 'lens';
import type { Dispatch, FC } from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppStore } from 'src/store/app';
import { useSigner, useSignTypedData } from 'wagmi';

interface Props {
  profile: Profile;
  setFollowing: Dispatch<boolean>;
  showText?: boolean;
}

const Unfollow: FC<Props> = ({ profile, showText = false, setFollowing }) => {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const [writeLoading, setWriteLoading] = useState(false);
  const { isLoading: signLoading, signTypedDataAsync } = useSignTypedData({ onError });
  const { data: signer } = useSigner();

  const burnWithSig = async (signature: string, typedData: CreateBurnEip712TypedData) => {
    const { tokenId, deadline } = typedData.value;
    const { v, r, s } = splitSignature(signature);
    const sig = { v, r, s, deadline };

    const followNftContract = new Contract(typedData.domain.verifyingContract, FollowNFT, signer as Signer);

    const tx = await followNftContract.burnWithSig(tokenId, sig);
    if (tx) {
      setFollowing(false);
    }
  };

  const { broadcast } = useBroadcast({
    onCompleted: () => {
      setFollowing(false);
    }
  });

  const [createUnfollowTypedData, { loading: typedDataLoading }] = useCreateUnfollowTypedDataMutation({
    onCompleted: async ({ createUnfollowTypedData }) => {
      try {
        const { typedData, id } = createUnfollowTypedData;
        const signature = await signTypedDataAsync(getSignature(typedData));

        setWriteLoading(true);
        try {
          if (!RELAY_ON) {
            return await burnWithSig(signature, typedData);
          }
          const { data } = await broadcast({ request: { id, signature } });
          if (data?.broadcast?.reason) {
            await burnWithSig(signature, typedData);
          }
          toast.success('Unfollowed successfully!');
        } catch {
          toast.error('User rejected request');
        } finally {
          setWriteLoading(false);
        }
      } catch {}
    },
    onError
  });

  const createUnfollow = () => {
    if (!currentProfile) {
      return toast.error(SIGN_WALLET);
    }

    createUnfollowTypedData({
      variables: {
        request: { profile: profile?.id }
      }
    });
  };

  return (
    <Button
      className="text-sm !px-3 !py-1.5"
      outline
      onClick={createUnfollow}
      disabled={typedDataLoading || signLoading || writeLoading}
      variant="danger"
      aria-label="Unfollow"
      icon={
        typedDataLoading || signLoading || writeLoading ? (
          <Spinner variant="danger" size="xs" />
        ) : (
          <UserRemoveIcon className="w-4 h-4" />
        )
      }
    >
      {showText && 'Unfollow'}
    </Button>
  );
};

export default Unfollow;
