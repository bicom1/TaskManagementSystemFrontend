import { useState } from 'react';
import { toast } from 'sonner';
import { CreateMenuPopover } from './CreateMenuPopover';
import { CreateListModal } from './CreateListModal';
import { CreateFolderModal } from './CreateFolderModal';
import { CreateSprintFolderModal } from './CreateSprintFolderModal';
import { CreateSpaceWizard } from './CreateSpaceWizard';

/**
 * ClickUp-style create flow: menu → List / Folder / Sprint modals (+ Templates wizard).
 */
export function CreateProjectFlow({
  menuOpen,
  onMenuClose,
  anchorRef,
  menuCentered = false,
  wizardOpen,
  onWizardOpen,
  onWizardClose,
}) {
  const [activeKind, setActiveKind] = useState(null);

  const closeKind = () => setActiveKind(null);

  const handleSelect = (id) => {
    if (id === 'list' || id === 'folder' || id === 'sprint') {
      setActiveKind(id);
      return;
    }
    if (id === 'templates') {
      onWizardOpen?.();
      return;
    }
    if (id === 'imports') {
      toast.info('Imports coming soon');
    }
  };

  const openTemplates = () => {
    closeKind();
    onMenuClose?.();
    onWizardOpen?.();
  };

  return (
    <>
      <CreateMenuPopover
        open={menuOpen}
        onClose={onMenuClose}
        onSelect={handleSelect}
        anchorRef={anchorRef}
        centered={menuCentered}
      />

      <CreateListModal
        open={activeKind === 'list'}
        onClose={closeKind}
        onUseTemplates={openTemplates}
      />
      <CreateFolderModal
        open={activeKind === 'folder'}
        onClose={closeKind}
        onUseTemplates={openTemplates}
      />
      <CreateSprintFolderModal open={activeKind === 'sprint'} onClose={closeKind} />

      <CreateSpaceWizard open={wizardOpen} onClose={onWizardClose} />
    </>
  );
}
