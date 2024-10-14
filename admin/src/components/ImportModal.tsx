import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useFetchClient } from '@strapi/admin/strapi-admin';
import {
  Modal,
  Button,
  Flex,
  Typography,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
} from '@strapi/design-system';
import { ChevronDown, ChevronUp, Upload } from '@strapi/icons';

import { PLUGIN_ID } from '../pluginId';
import { ImportModalProps, RedirectImportType } from '../../../types/redirectPluginTypes';
import { getTranslation } from '../utils/getTranslation';

import { NoContentIcon } from '../components/Icons/NoContentIcon';
import { importTableHeaders } from '../utils/importTableHeaders';
import { parseAndValidateCSV } from '../utils/importParser';

const ImportModal = ({ visible, handleCloseImportModal }: ImportModalProps) => {
  const { formatMessage } = useIntl();
  const { post } = useFetchClient();

  const [redirects, setRedirects] = useState<RedirectImportType[]>([]);
  const [sortBy, setSortBy] = useState<string>('source');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const headers = importTableHeaders(formatMessage);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | DragEvent) => {
    try {
      const file =
        e.target instanceof HTMLInputElement && e.target.files
          ? e.target.files[0]
          : e instanceof DragEvent && e.dataTransfer
            ? e.dataTransfer.files[0]
            : null;

      if (!file) {
        throw new Error('No file selected or dropped.');
      }

      const readFileAsync = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      };

      const content = await readFileAsync(file);
      const data = await parseAndValidateCSV(content);

      const validRedirects = data.map((result) => ({
        source: result.source,
        destination: result.destination,
        permanent: result.permanent,
        status: result.status,
      }));

      setRedirects(validRedirects);
    } catch (error) {
      console.error('Error handling file change:', error);
    }
  };

  const handleImport = async () => {
    try {
      // Remove the `status` field from redirects before importing
      const dataToImport = redirects.map(({ status, ...rest }) => rest);

      const response = await post(`/${PLUGIN_ID}/import`, dataToImport);
      console.log('Import successful:', response);

      // Optionally, you can handle the response and update the UI
      handleCloseImportModal();
    } catch (error) {
      console.error('Error importing redirects:', error);
    }
  };

  return (
    <Modal.Root onOpenChange={handleCloseImportModal} open={visible} labelledBy="title">
      <Modal.Content>
        <Modal.Header>
          <Modal.Title id="title">
            {formatMessage({
              id: getTranslation('modal.import.title'),
              defaultMessage: 'Import Redirects',
            })}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {redirects.length > 0 && (
            <Table>
              <Thead>
                <Tr>
                  {headers.map((header, index) => (
                    <Th
                      key={header.key}
                      onClick={header.isSortable ? () => handleSort(header.key) : undefined}
                      style={{ cursor: header.isSortable ? 'pointer' : 'default' }}
                    >
                      <Flex
                        alignItems="center"
                        justifyContent={index === headers.length - 1 ? 'flex-end' : ''}
                        style={{ width: index === headers.length - 1 ? '100%' : 'auto' }}
                      >
                        <Typography variant="sigma">{header.label}</Typography>
                        {header.isSortable && (
                          <Box paddingLeft={1}>
                            {sortBy === header.key ? (
                              sortOrder === 'asc' ? (
                                <ChevronUp aria-label="Sorted ascending" />
                              ) : (
                                <ChevronDown aria-label="Sorted descending" />
                              )
                            ) : null}
                          </Box>
                        )}
                      </Flex>
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {redirects.map((redirect, idx) => (
                  <Tr key={idx}>
                    <Td>
                      <Typography>{redirect.source}</Typography>
                    </Td>
                    <Td>
                      <Typography>{redirect.destination}</Typography>
                    </Td>
                    <Td>
                      <Typography>{redirect.permanent ? 'Yes' : 'No'}</Typography>
                    </Td>
                    <Td>
                      <Typography>{redirect.status}</Typography>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary" onClick={handleCloseImportModal}>
              {formatMessage({
                id: getTranslation('modal.cancel'),
                defaultMessage: 'Cancel',
              })}
            </Button>
          </Modal.Close>

          <Button
            type="submit"
            startIcon={<Upload />}
            disabled={redirects.length === 0}
            onClick={handleImport}
          >
            {formatMessage({
              id: 'modal.import.confirm',
              defaultMessage: 'Import Redirects',
            })}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export { ImportModal };