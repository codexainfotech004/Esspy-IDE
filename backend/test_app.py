import tempfile
import unittest

from backend import app as backend


class BackendRouteTests(unittest.TestCase):
    def setUp(self):
        self.projects_dir = tempfile.TemporaryDirectory()
        self.original_projects_dir = backend.PROJECTS_DIR
        backend.PROJECTS_DIR = self.projects_dir.name
        self.client = backend.app.test_client()

    def tearDown(self):
        backend.PROJECTS_DIR = self.original_projects_dir
        self.projects_dir.cleanup()

    def test_frontend_files_are_served_from_project_root(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<!DOCTYPE html>', response.data)
        self.assertEqual(
            response.headers['Cache-Control'],
            'no-store, no-cache, must-revalidate, max-age=0',
        )
        response.close()

        favicon = self.client.get('/favicon.ico')
        self.assertEqual(favicon.status_code, 200)
        self.assertEqual(favicon.mimetype, 'image/svg+xml')
        favicon.close()

    def test_json_endpoints_reject_missing_json_as_bad_request(self):
        requests = (
            ('/api/generate', 'post'),
            ('/upload', 'post'),
            ('/upload-arduino', 'post'),
            ('/execute', 'post'),
            ('/api/serial-monitor/open', 'post'),
            ('/api/serial-monitor/send', 'post'),
            ('/api/voice', 'post'),
        )
        for path, method in requests:
            with self.subTest(path=path):
                response = getattr(self.client, method)(path)
                self.assertEqual(response.status_code, 400)
                self.assertFalse(response.get_json()['success'])

    def test_project_lifecycle_preserves_unicode_names(self):
        filename = 'माझा-प्रकल्प.bbp'
        saved = self.client.post('/api/save', json={
            'name': filename,
            'language': 'mr',
            'workspace': {'blocks': []},
        })
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.get_json()['filename'], filename)

        listed = self.client.get('/api/projects').get_json()
        self.assertEqual(listed['projects'], [filename])

        loaded = self.client.get(f'/api/load/{filename}')
        self.assertEqual(loaded.status_code, 200)
        self.assertEqual(loaded.get_json()['project']['language'], 'mr')

        deleted = self.client.delete(f'/api/delete/{filename}')
        self.assertEqual(deleted.status_code, 200)

    def test_project_paths_cannot_escape_projects_directory(self):
        response = self.client.post('/api/save', json={
            'name': '../outside',
            'workspace': {'blocks': []},
        })
        self.assertEqual(response.status_code, 400)

        response = self.client.get('/api/load/..%5Coutside.bbp')
        self.assertEqual(response.status_code, 400)


class SerialReaderTests(unittest.TestCase):
    def test_reader_marks_monitor_disconnected_after_serial_error(self):
        import serial

        class BrokenSerial:
            is_open = True

            @property
            def in_waiting(self):
                raise serial.SerialException('disconnected')

            def close(self):
                self.is_open = False

        fake_serial = BrokenSerial()
        backend._serial_mon['serial'] = fake_serial
        backend._serial_mon['running'] = True

        backend._serial_reader(fake_serial)

        self.assertFalse(backend._serial_mon['running'])
        self.assertIsNone(backend._serial_mon['serial'])
        self.assertFalse(fake_serial.is_open)


if __name__ == '__main__':
    unittest.main()
