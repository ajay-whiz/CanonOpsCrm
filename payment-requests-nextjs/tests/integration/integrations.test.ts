import { describe, it, expect } from 'vitest';
import { createAsanaTask, createGoogleDriveFolder, createQboVendor } from '../../src/services/integrations/asanaService';
import { gdriveService } from '../../src/services/integrations/gdriveService';
import { qboService } from '../../src/services/integrations/qboService';

describe('Integrations', () => {
  it('should create a task in Asana', async () => {
    const taskData = { name: 'Test Task', notes: 'This is a test task' };
    const response = await createAsanaTask(taskData);
    expect(response).toHaveProperty('id');
  });

  it('should create a folder in Google Drive', async () => {
    const folderName = 'Test Folder';
    const response = await createGoogleDriveFolder(folderName);
    expect(response).toHaveProperty('id');
  });

  it('should create a vendor in QuickBooks Online', async () => {
    const vendorData = { name: 'Test Vendor', email: 'vendor@example.com' };
    const response = await createQboVendor(vendorData);
    expect(response).toHaveProperty('Id');
  });
});