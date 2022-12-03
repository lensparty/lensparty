import type { ApolloCache } from '@apollo/client';
import type { LensPublication } from '@generated/types';
import { ArrowSmUpIcon } from '@heroicons/react/solid';
import { publicationKeyFields } from '@lib/keyFields';
import nFormatter from '@lib/nFormatter';
import onError from '@lib/onError';
import { SIGN_WALLET } from 'data/constants';
import { motion } from 'framer-motion';
import { ReactionTypes, useAddReactionMutation, useRemoveReactionMutation } from 'lens';
import { useRouter } from 'next/router';
import type { FC } from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppStore } from 'src/store/app';

interface Props {
  publication: LensPublication;
  isFullPublication: boolean;
}

const UpVote: FC<Props> = ({ publication }) => {
  const { pathname } = useRouter();
  const isMirror = publication.__typename === 'Mirror';
  const currentProfile = useAppStore((state) => state.currentProfile);
  const [upvoted, setUpvoted] = useState(
    (isMirror ? publication?.mirrorOf?.reaction : publication?.reaction) === 'UPVOTE'
  );
  const [count, setCount] = useState(
    isMirror ? publication?.mirrorOf?.stats?.totalUpvotes : publication?.stats?.totalUpvotes
  );

  const updateCache = (cache: ApolloCache<any>, type: ReactionTypes.Upvote | ReactionTypes.Downvote) => {
    if (pathname === '/posts/[id]') {
      cache.modify({
        id: publicationKeyFields(isMirror ? publication?.mirrorOf : publication),
        fields: {
          stats: (stats) => ({
            ...stats,
            totalUpvotes: type === ReactionTypes.Upvote ? stats.totalUpvotes + 1 : stats.totalUpvotes - 1
          })
        }
      });
    }
  };

  const [addReaction] = useAddReactionMutation({
    onCompleted: () => {},
    onError: (error) => {
      setUpvoted(!upvoted);
      setCount(count - 1);
      onError(error);
    },
    update: (cache) => updateCache(cache, ReactionTypes.Upvote)
  });

  const [removeReaction] = useRemoveReactionMutation({
    onCompleted: () => {},
    onError: (error) => {
      setUpvoted(!upvoted);
      setCount(count + 1);
      onError(error);
    },
    update: (cache) => updateCache(cache, ReactionTypes.Downvote)
  });

  const createUpvote = () => {
    if (!currentProfile) {
      return toast.error(SIGN_WALLET);
    }

    const variable = {
      variables: {
        request: {
          profileId: currentProfile?.id,
          reaction: ReactionTypes.Upvote,
          publicationId: publication.__typename === 'Mirror' ? publication?.mirrorOf?.id : publication?.id
        }
      }
    };

    if (upvoted) {
      setUpvoted(false);
      setCount(count - 1);
      removeReaction(variable);
    } else {
      setUpvoted(true);
      setCount(count + 1);
      addReaction(variable);
    }
  };

  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={createUpvote} aria-label="UpVote">
      <span
        className={`flex items-center space-x-2   hover:bg-blue-300 hover:bg-opacity-20 px-2 py-1 rounded-xl ${
          upvoted ? 'text-brand-500' : 'text-gray-500'
        }`}
      >
        <span className="">
          <ArrowSmUpIcon className={`w-7 h-7 ${upvoted ? 'text-brand-500' : 'text-gray-500'}`} />
        </span>
        <span className="text-[11px] sm:text-sm">{nFormatter(count)}</span>
      </span>
    </motion.button>
  );
};

export default UpVote;
