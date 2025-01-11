from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

class HealthCheckTests(APITestCase):
    def test_health_check_endpoint(self):
        """
        Ensure health check endpoint returns successful response.
        """
        url = reverse('health_check')
        response = self.client.get(url)
        
        # Verify response contains all expected keys
        self.assertIn('status', response.data)
        self.assertIn('database', response.data)
        self.assertIn('redis', response.data)
        self.assertIn('system', response.data)
        
        # Check if the response is successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)