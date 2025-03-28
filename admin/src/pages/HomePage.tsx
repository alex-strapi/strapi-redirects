import { useIntl } from 'react-intl';
import * as qs from 'qs';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Layouts, useFetchClient, useNotification } from '@strapi/admin/strapi-admin';
import {
  Main,
  Flex,
  Box,
  Button,
  Typography,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Checkbox,
  EmptyStateLayout,
  Loader,
  SearchForm,
  Searchbar,
  Field,
  SingleSelect,
  SingleSelectOption,
} from '@strapi/design-system';
import { Pencil, Plus, Trash, ChevronUp, ChevronDown, Upload } from '@strapi/icons';

import { PLUGIN_ID } from '../pluginId';
import { RedirectType, PaginationType } from '../../../types/redirectPluginTypes';
import { getTranslation } from '../utils/getTranslation';
import { redirectTableHeaders } from '../utils/redirectTableHeaders';
import { redirectQuery } from '../utils/redirectQuery';
import { useSearchQuery } from '../hooks/useSearchQuery';

import { NoContentIcon } from '../components/Icons/NoContentIcon';
import { RedirectModal } from '../components/RedirectModal';
import { ImportModal } from '../components/ImportModal';
import { Pagination } from '../components/Pagination';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get, del } = useFetchClient();

  const pageSizes = [5, 10, 20, 50];
  const headers = redirectTableHeaders(formatMessage);
  const { pageSize, page, setNewPage, setNewPageSize } = useSearchQuery();

  const [isFetching, setIsFetching] = useState(false);
  const [redirects, setRedirects] = useState<RedirectType[]>([]);
  const [selectedRedirect, setSelectedRedirect] = useState<RedirectType | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });

  // Modal state management
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Bulk delete state
  const [selectedRedirects, setSelectedRedirects] = useState<string[]>([]);

  const handleRedirectModal = () => {
    setIsRedirectModalOpen(true);
  };

  const handleCloseRedirectModal = () => {
    setIsRedirectModalOpen(false);
    setSelectedRedirect(null);
    getRedirects();
  };

  const handleImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    getRedirects();
  };

  const handleEdit = (redirect: RedirectType) => {
    setSelectedRedirect(redirect);
    setIsRedirectModalOpen(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field && sortBy !== 'createdAt') {
      if(sortOrder === 'desc') setSortOrder('asc');
      else {
        setSortOrder('desc');
        setSortBy('createdAt');
      }
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setNewPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setNewPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setNewPageSize(Number(newPageSize));
    setNewPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (documentId: string) => {
    try {
      await del(`${PLUGIN_ID}/${documentId}`);
      getRedirects();
    } catch (error) {
      console.error('Error deleting redirect', error);
      toggleNotification({
        type: 'warning',
        message: `Error deleting redirect ${error}`,
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedRedirects.map((documentId) => del(`${PLUGIN_ID}/${documentId}`)));
      setSelectedRedirects([]);
      getRedirects();
    } catch (error) {
      console.error('Error deleting selected redirects', error);
      toggleNotification({
        type: 'warning',
        message: `Error deleting selected redirects ${error}`,
      });
    }
  };

  const getRedirects = async () => {
    try {
      setIsFetching(true);

      const queryObject = redirectQuery({
        sortBy,
        sortOrder,
        pageSize: Number(pageSize),
        page: Number(page),
        searchQuery,
      });

      const queryString = qs.stringify(queryObject, { encodeValuesOnly: true });

      const { data }: any = await get(`/${PLUGIN_ID}?${queryString}`);

      setRedirects(data.redirects);
      setPagination(data.meta.pagination);
    } catch (error) {
      console.error('Error fetching redirects:', error);
      setRedirects([]);
      setPagination({
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total: 0,
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    getRedirects();
  }, [sortBy, sortOrder, pageSize, page, searchQuery]);

  useEffect(() => {
    setSearchQuery(debouncedSearchTerm);
    setNewPage(1);
  }, [debouncedSearchTerm]);

  return (
    <Main style={{maxWidth: 'calc(100vw - 75px)'}}>
      <Layouts.Header
        primaryAction={
          <Flex gap={4}>
            <Button variant="secondary" startIcon={<Upload />} onClick={handleImportModal}>
              {formatMessage({
                id: getTranslation('pages.homePage.header.button.import'),
                defaultMessage: 'Import Redirects',
              })}
            </Button>

            <Button variant="primary" startIcon={<Plus />} onClick={handleRedirectModal}>
              {formatMessage({
                id: getTranslation('pages.homePage.header.button.redirect'),
                defaultMessage: 'Add a Redirect',
              })}
            </Button>
          </Flex>
        }
        title={formatMessage({
          id: getTranslation('plugin.name'),
          defaultMessage: 'Redirects',
        })}
        subtitle={formatMessage(
          {
            id: getTranslation('pages.homePage.header.subtitle'),
            defaultMessage:
              '{number, plural, =0 {# entries} one {# entry} other {# entries}} found',
          },
          { number: pagination?.total }
        )}
      />
      <Layouts.Content>
        <Flex gap={4} direction="column" alignItems="stretch" marginBottom={8}>
          <Box paddingBottom={4}>
            <Flex gap={4} alignItems="center">
              <SearchForm>
                <Searchbar
                  name="searchbar"
                  onClear={() => setSearchTerm('')}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  clearLabel={formatMessage({
                    id: 'pages.homePage.search.clearLabel',
                    defaultMessage: 'Clear redirects',
                  })}
                  placeholder={formatMessage({
                    id: 'pages.homePage.search.placeholder',
                    defaultMessage: 'Search redirects...',
                  })}
                >
                  {formatMessage({
                    id: 'pages.homePage.search.ariaLabel',
                    defaultMessage: 'Searching redirects',
                  })}
                </Searchbar>
              </SearchForm>
              {selectedRedirects.length > 0 && (
                <Button variant="danger" onClick={handleBulkDelete} endIcon={<Trash />}>
                  {formatMessage({
                    id: 'pages.homePage.bulkDelete',
                    defaultMessage: 'Delete Selected',
                  })}
                </Button>
              )}
            </Flex>
          </Box>

          {isFetching ? (
            <Flex padding={4} direction="column" justifyContent="center" alignItems="center">
              <Loader />
              <Typography marginLeft={2}>
                {formatMessage({ id: 'loading', defaultMessage: 'Loading...' })}
              </Typography>
            </Flex>
          ) : redirects.length > 0 ? (
            <>
              <Table>
                <Thead>
                  <Tr>
                    <Th>
                      <Checkbox
                        aria-label="Select all entries"
                        checked={
                          selectedRedirects.length === redirects.length
                            ? true
                            : selectedRedirects.length > 0 &&
                                selectedRedirects.length < redirects.length
                              ? 'indeterminate'
                              : false
                        }
                        onCheckedChange={(checked: any) => {
                          if (checked) {
                            setSelectedRedirects(
                              redirects
                                .map((redirect) => redirect.documentId)
                                .filter(Boolean) as string[]
                            );
                          } else {
                            setSelectedRedirects([]);
                          }
                        }}
                      />
                    </Th>
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
                  {redirects.map((redirect: RedirectType) => (
                    <Tr key={redirect.id}>
                      <Td>
                        <Checkbox
                          aria-label={`Select entry ${redirect.id}`}
                          checked={selectedRedirects.includes(redirect.documentId ?? '')}
                          onCheckedChange={(checked: any) => {
                            if (checked) {
                              setSelectedRedirects([
                                ...selectedRedirects,
                                redirect.documentId ?? '',
                              ]);
                            } else {
                              setSelectedRedirects(
                                selectedRedirects.filter((id) => id !== (redirect.documentId ?? ''))
                              );
                            }
                          }}
                        />
                      </Td>
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
                        <Flex gap={2} justifyContent="flex-end">
                          <Button
                            variant="secondary"
                            onClick={() => handleEdit(redirect)}
                            endIcon={<Pencil />}
                          >
                            {formatMessage({
                              id: getTranslation('pages.homePage.table.edit'),
                              defaultMessage: 'Edit',
                            })}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => {
                              if (redirect.documentId) {
                                handleDelete(redirect.documentId);
                              }
                            }}
                            endIcon={<Trash />}
                          >
                            {formatMessage({
                              id: getTranslation('pages.homePage.table.delete'),
                              defaultMessage: 'Delete',
                            })}
                          </Button>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              <Flex justifyContent="space-between">
                <Field.Root name="pageSize">
                  <Field.Label>
                    {formatMessage({
                      id: getTranslation('pages.homePage.entries.title'),
                      defaultMessage: 'Entries per page',
                    })}
                  </Field.Label>
                  <SingleSelect
                    onChange={(value: string) => handlePageSizeChange(value)}
                    value={String(pageSize)}
                  >
                    {pageSizes.map((size) => (
                      <SingleSelectOption key={size} value={String(size)}>
                        {size}
                      </SingleSelectOption>
                    ))}
                  </SingleSelect>
                  <Field.Hint />
                </Field.Root>

                {/* Pagination */}
                <Box paddingTop={4}>
                  {pagination && (
                    <Pagination
                      activePage={pagination.page}
                      pageCount={pagination.pageCount}
                      handlePageChange={handlePageChange}
                    />
                  )}
                </Box>
              </Flex>
            </>
          ) : (
            <Box background="neutral100">
              <EmptyStateLayout
                icon={<NoContentIcon />}
                content={formatMessage({
                  id: getTranslation('overview.table.body.empty.content'),
                  defaultMessage: "You don't have any redirects yet...",
                })}
                action={
                  <Button variant="secondary" startIcon={<Plus />} onClick={handleRedirectModal}>
                    {formatMessage({
                      id: getTranslation('overview.table.body.empty.button'),
                      defaultMessage: 'Create your first Redirect',
                    })}
                  </Button>
                }
              />
            </Box>
          )}
        </Flex>
      </Layouts.Content>

      {/* Redirect Modal */}
      <RedirectModal
        visible={isRedirectModalOpen}
        selectedRedirect={selectedRedirect}
        handleCloseRedirectModal={handleCloseRedirectModal}
        onRedirectSaved={getRedirects}
      />

      {/* Import Modal */}
      <ImportModal visible={isImportModalOpen} handleCloseImportModal={handleCloseImportModal} />
    </Main>
  );
};

export { HomePage };
