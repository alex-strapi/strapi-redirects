import * as yup from 'yup';
import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Form, useFetchClient } from '@strapi/strapi/admin';
import { Modal, Button, Grid, Field, Checkbox, Box, Flex } from '@strapi/design-system';
import { Check } from '@strapi/icons';

import { RedirectModalProps } from '../../../types/redirectPluginTypes';
import { getTranslation } from '../utils/getTranslation';
import { PLUGIN_ID } from '../pluginId';

const RedirectModal = ({
  visible,
  selectedRedirect = null,
  handleCloseRedirectModal,
  onRedirectSaved,
}: RedirectModalProps) => {
  const { formatMessage } = useIntl();
  const { post, put } = useFetchClient();

  // Initialize state with default values to ensure controlled components
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    permanent: false, // Initialize as false
  });

  // State for tracking form errors
  const [formErrors, setFormErrors] = useState<{ source?: string; destination?: string }>({});

  // Populate form fields when editing an existing redirect
  useEffect(() => {
    if (selectedRedirect) {
      setFormData({
        source: selectedRedirect.source || '',
        destination: selectedRedirect.destination || '',
        permanent: selectedRedirect.permanent || false,
      });
    } else {
      setFormData({
        source: '',
        destination: '',
        permanent: false,
      });
    }
  }, [selectedRedirect]);

  // Handle input changes for text fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permanent: value,
    }));
  };

  // Validation schema for the form
  const validationSchema = yup.object().shape({
    source: yup.string().required('Source is required'),
    destination: yup.string().required('Destination is required'),
    permanent: yup.boolean(),
  });

  // Handle form submission (create or update)
  const handleSubmit = async (redirect: any) => {
    try {
      setFormErrors({}); // Clear previous errors

      // Include the 'permanent' field in the redirect object
      const payload = { ...redirect, permanent: formData.permanent };

      if (selectedRedirect && selectedRedirect.documentId) {
        // Update existing redirect
        await put(`${PLUGIN_ID}/${selectedRedirect.documentId}`, payload);
      } else {
        // Create new redirect
        await post(`${PLUGIN_ID}`, payload);
      }

      handleCloseRedirectModal();
      onRedirectSaved(); // Trigger refetching of redirects
    } catch (error: any) {
      // Handle specific error responses
      const errorDetails = error?.response?.data?.error?.details;
      if (errorDetails?.type === 'DUPLICATE') {
        setFormErrors({ source: error.response.data.error.message });
      } else if (errorDetails?.type === 'LOOP') {
        setFormErrors({
          source: error.response.data.error.message,
          destination: error.response.data.error.message,
        });
      } else {
        setFormErrors({ source: 'An error occurred. Please try again.' });
      }
    }
  };

  // Destructure formData for ease of access
  const { source, destination, permanent } = formData;

  return (
    <Modal.Root onOpenChange={handleCloseRedirectModal} open={visible} labelledBy="title">
      <Modal.Content>
        <Modal.Header>
          <Modal.Title id="title">
            {selectedRedirect
              ? formatMessage({
                  id: getTranslation('modal.redirect.title.edit'),
                  defaultMessage: 'Edit a Redirect',
                })
              : formatMessage({
                  id: getTranslation('modal.redirect.title.create'),
                  defaultMessage: 'Add a Redirect',
                })}
          </Modal.Title>
        </Modal.Header>
        <Form
          key={selectedRedirect ? selectedRedirect.documentId : 'new'}
          method={selectedRedirect ? 'PUT' : 'POST'}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
          initialValues={{ source, destination, permanent }}
        >
          <Modal.Body>
            <Grid.Root gap={4} gridCols={12}>
              <Grid.Item col={5}>
                <Box width="100%">
                  <Field.Root name="source" error={formErrors.source}>
                    <Field.Label>
                      {formatMessage({
                        id: getTranslation('modal.redirect.field.source'),
                        defaultMessage: 'Source',
                      })}
                    </Field.Label>
                    <Field.Input type="text" name="source" value={source} onChange={handleChange} />
                    {formErrors.source && <Field.Error>{formErrors.source}</Field.Error>}
                  </Field.Root>
                </Box>
              </Grid.Item>
              <Grid.Item col={5}>
                <Box width="100%">
                  <Field.Root name="destination" error={formErrors.destination}>
                    <Field.Label>
                      {formatMessage({
                        id: getTranslation('modal.redirect.field.destination'),
                        defaultMessage: 'Destination',
                      })}
                    </Field.Label>
                    <Field.Input
                      type="text"
                      name="destination"
                      value={destination}
                      onChange={handleChange}
                    />
                    {formErrors.destination && <Field.Error>{formErrors.destination}</Field.Error>}
                  </Field.Root>
                </Box>
              </Grid.Item>
              <Grid.Item col={2}>
                <Box width="100%" height="100%">
                  <Flex alignItems="center" height="100%" paddingTop="16px">
                    <Checkbox
                      name="permanent"
                      checked={permanent}
                      onCheckedChange={handleCheckboxChange}
                    >
                      {formatMessage({
                        id: getTranslation('modal.redirect.field.permanent'),
                        defaultMessage: 'Permanent',
                      })}
                    </Checkbox>
                  </Flex>
                </Box>
              </Grid.Item>
            </Grid.Root>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="tertiary" onClick={handleCloseRedirectModal}>
                {formatMessage({
                  id: getTranslation('modal.cancel'),
                  defaultMessage: 'Cancel',
                })}
              </Button>
            </Modal.Close>

            <Button type="submit" startIcon={<Check />}>
              {formatMessage({ id: 'modal.redirect.confirm', defaultMessage: 'Save' })}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal.Content>
    </Modal.Root>
  );
};

export { RedirectModal };
