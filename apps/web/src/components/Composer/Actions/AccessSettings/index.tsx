import HelpTooltip from '@components/UI/HelpTooltip';
import { Modal } from '@components/UI/Modal';
import { Tooltip } from '@components/UI/Tooltip';
import { LockClosedIcon } from '@heroicons/react/outline';
import isFeatureEnabled from '@lib/isFeatureEnabled';
import { motion } from 'framer-motion';
import type { FC } from 'react';
import { useState } from 'react';
import { useAppStore } from 'src/store/app';

import BasicSettings from './BasicSettings';

const AccessSettings: FC = () => {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const [showModal, setShowModal] = useState(false);

  if (!isFeatureEnabled('access-settings', currentProfile?.id)) {
    return null;
  }

  return (
    <>
      <Tooltip placement="top" content="Access">
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => {
            setShowModal(!showModal);
          }}
          aria-label="Access"
        >
          <LockClosedIcon className="h-5 w-5 text-brand" />
        </motion.button>
      </Tooltip>
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <span>Access settings</span>
            <HelpTooltip content="Add restrictions on who can view your content, and who can't. For instance - token gate your posts on the condition of owning specific NFTs or tokens." />
          </div>
        }
        icon={<LockClosedIcon className="w-5 h-5 text-brand" />}
        show={showModal}
        onClose={() => setShowModal(false)}
      >
        <BasicSettings />
      </Modal>
    </>
  );
};

export default AccessSettings;
