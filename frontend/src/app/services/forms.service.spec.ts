import { of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsService } from './forms.service';

describe('FormsService', () => {
  let service: FormsService;
  let mockHttp: { post: jest.Mock };

  beforeEach(() => {
    mockHttp = { post: jest.fn() };
    service = new FormsService(mockHttp as unknown as HttpClient);
  });

  it('validate posts to /forms/validate with the payload', () => {
    mockHttp.post.mockReturnValue(of({ valid: true, errors: [] }));
    let result: unknown;
    service.validate({ title: 'Test' }).subscribe((r) => {
      result = r;
    });
    expect(mockHttp.post).toHaveBeenCalledWith(
      expect.stringContaining('/forms/validate'),
      { title: 'Test' },
    );
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('createForm posts to /forms/create with Authorization header', () => {
    mockHttp.post.mockReturnValue(of({ formId: 'id1', formUrl: 'https://forms.google.com/abc' }));
    let result: unknown;
    service.createForm({ title: 'T' }, 'my-token').subscribe((r) => {
      result = r;
    });
    const [url, body, options] = mockHttp.post.mock.calls[0] as [
      string,
      unknown,
      { headers: HttpHeaders },
    ];
    expect(url).toContain('/forms/create');
    expect(body).toEqual({ title: 'T' });
    expect(options.headers.get('Authorization')).toBe('Bearer my-token');
    expect(result).toEqual({ formId: 'id1', formUrl: 'https://forms.google.com/abc' });
  });
});
