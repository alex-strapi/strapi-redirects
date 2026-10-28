import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useFetchClient, Layouts } from '@strapi/strapi/admin';
import {
  Main,
  Box,
  Typography,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  SingleSelect,
  SingleSelectOption,
} from '@strapi/design-system';
import { PLUGIN_ID } from '../pluginId';
import { LifecycleSetting, ContentType } from '../../../types/redirectPluginTypes';

const Settings: React.FC = () => {
  const { formatMessage } = useIntl();
  const { get, post } = useFetchClient();

  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [lifecycleSettings, setLifecycleSettings] = useState<LifecycleSetting[]>([]);

  /**
   * Fetch content types
   */
  const fetchContentTypes = async () => {
    try {
      const res = await get(`/${PLUGIN_ID}/content-types`);
      setContentTypes(res.data || []);
    } catch (error) {
      console.error('Error fetching content types:', error);
    }
  };

  /**
   * Fetch lifecycle settings
   */
  const fetchLifecycleSettings = async () => {
    try {
      const res = await get(`/${PLUGIN_ID}/settings`);
      const settings = res.data || [];

      const settingsArray = Array.isArray(settings)
        ? settings
        : Object.entries(settings as Record<string, Partial<LifecycleSetting>>).map(
            ([uid, value]) => ({ uid, ...value })
          );

      setLifecycleSettings(settingsArray);
    } catch (error) {
      console.error('Error fetching lifecycle settings:', error);
      setLifecycleSettings([]); // Fallback to empty array
    }
  };

  /**
   * Update a specific setting
   */
  const updateSingleSetting = async (uid: string, changes: Partial<LifecycleSetting>) => {
    try {
      await post(`/${PLUGIN_ID}/settings`, { uid, ...changes });
    } catch (error) {
      console.error('Error updating lifecycle setting:', error);
    }
  };

  /**
   * Toggle checkbox for a single content type
   */
  const handleToggle = (uid: string, enabled: boolean) => {
    setLifecycleSettings((prev) =>
      prev.map((setting) => (setting.uid === uid ? { ...setting, enabled } : setting))
    );

    const current = lifecycleSettings.find((setting) => setting.uid === uid) || { field: '' };
    updateSingleSetting(uid, { enabled, field: current.field });
  };

  /**
   * Change the selected field for a single content type
   */
  const handleFieldChange = (uid: string, field: string) => {
    setLifecycleSettings((prev) =>
      prev.map((setting) => (setting.uid === uid ? { ...setting, field } : setting))
    );

    const current = lifecycleSettings.find((setting) => setting.uid === uid) || { enabled: false };
    updateSingleSetting(uid, { field, enabled: current.enabled });
  };

  useEffect(() => {
    fetchContentTypes();
    fetchLifecycleSettings();
  }, []);

  return (
    <Main>
      <Layouts.Header
        title={formatMessage({
          id: `${PLUGIN_ID}.settings.title`,
          defaultMessage: 'Lifecycle Settings',
        })}
        subtitle={formatMessage({
          id: `${PLUGIN_ID}.settings.subtitle`,
          defaultMessage:
            'Enable or disable lifecycle hooks and select fields for each content type (auto-saves).',
        })}
      />
      <Layouts.Content>
        <Box padding={4} background="neutral0">
          {contentTypes.length === 0 ? (
            <Typography>No content types found.</Typography>
          ) : (
            <Table colCount={4} rowCount={contentTypes.length + 1}>
              <Thead>
                <Tr>
                  <Th>
                    <Typography variant="sigma">Content Type</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">UID</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Enabled</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Field</Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {contentTypes.map((ct) => {
                  const setting = lifecycleSettings.find((s) => s.uid === ct.uid) || {
                    uid: ct.uid,
                    enabled: false,
                    field: '',
                  };

                  return (
                    <Tr key={ct.uid}>
                      <Td>
                        <Typography>{ct.info?.displayName || ct.uid}</Typography>
                      </Td>
                      <Td>
                        <Typography textColor="neutral600">{ct.uid}</Typography>
                      </Td>
                      <Td>
                        <Checkbox
                          checked={setting.enabled}
                          onCheckedChange={() => handleToggle(ct.uid, !setting.enabled)}
                        />
                      </Td>
                      <Td>
                        <SingleSelect
                          placeholder="Select field"
                          value={setting.field}
                          onChange={(value: string) => handleFieldChange(ct.uid, value)}
                          disabled={!setting.enabled}
                        >
                          {ct.fields.map((field) => (
                            <SingleSelectOption key={field.name} value={field.name}>
                              {field.name}
                            </SingleSelectOption>
                          ))}
                        </SingleSelect>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </Box>
      </Layouts.Content>
    </Main>
  );
};

export { Settings };
