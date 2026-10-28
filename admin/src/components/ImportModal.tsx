import React, { useState } from 'react';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { useFetchClient } from '@strapi/strapi/admin';
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
import { ChevronDown, ChevronUp, File, Upload } from '@strapi/icons';

import { PLUGIN_ID } from '../pluginId';
import { ImportModalProps, RedirectImportType } from '../../../types/redirectPluginTypes';
import { getTranslation } from '../utils/getTranslation';

import { importTableHeaders } from '../utils/importTableHeaders';
import { parseAndValidateCSV } from '../utils/importParser';

const StyledLabel = styled.label<{ isDragOver: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 48px;
  border-width: 3px;
  border-color: ${({ isDragOver }) => (isDragOver ? 'hsl(210, 100%, 50%)' : '#ddd')};
  border-style: dashed;
  border-radius: 12px;
  cursor: pointer;

  &::after {
    content: '';
    display: ${({ isDragOver }) => (isDragOver ? 'block' : 'none')};
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 5;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ImportModal = ({ visible, handleCloseImportModal }: ImportModalProps) => {
  const { formatMessage } = useIntl();
  const { post } = useFetchClient();

  const [redirects, setRedirects] = useState<RedirectImportType[]>([]);
  const [sortBy, setSortBy] = useState<string>('source');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDragOver, setIsDragOver] = useState(false);

  const headers = importTableHeaders(formatMessage);

  const handleSort = (field: string) => {
    let sortedRedirects = [...redirects];

    // Toggle sort order or set new sort field
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }

    // Sort logic based on field and order
    sortedRedirects.sort((a, b) => {
      const valA = a[field as keyof RedirectImportType];
      const valB = b[field as keyof RedirectImportType];

      // Sort strings and booleans differently
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }
      return 0; // Fallback case
    });

    setRedirects(sortedRedirects);
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
      const dataToImport = redirects.map(({ status, ...rest }) => rest);

      const response = await post(`/${PLUGIN_ID}/import`, dataToImport);

      handleCloseImportModal();
    } catch (error) {
      console.error('Error importing redirects:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileChange(e);
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
          {redirects.length === 0 && (
            <Flex>
              <StyledLabel
                isDragOver={isDragOver}
                onDragEnter={handleDragOver}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Box padding={4}>
                  <File
                    width="24px"
                    height="24px"
                    color={isDragOver ? 'hsl(210, 100%, 50%)' : 'neutral600'}
                  />
                </Box>
                <Typography
                  variant="beta"
                  textColor={isDragOver ? 'hsl(210, 100%, 50%)' : 'neutral600'}
                  as="p"
                >
                  {formatMessage({
                    id: getTranslation('modal.import.dragAndDrop'),
                    defaultMessage: 'Drag and drop your CSV file here, or click to upload',
                  })}
                </Typography>
                <HiddenInput type="file" accept=".csv" onChange={handleFileChange} />
              </StyledLabel>
            </Flex>
          )}

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
                      <Flex width="100%" justifyContent="flex-end">
                        <Typography>{redirect.status}</Typography>
                      </Flex>
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
