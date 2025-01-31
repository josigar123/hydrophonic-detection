interface Data {
  window_type: string | [string, number];
  n_samples: number;
  frequency_cutoff: number;
  uri: string; // Currently represents a path, but will later be a URI
}

interface Response {
  message: string;
  image_url: string;
}

const base_url = 'http://127.0.0.1:8000/';
export async function postParameters(
  uri: string,
  payload: Data
): Promise<Response> {
  const url = base_url + uri;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Network response was not ok');
    }

    const data: Response = await res.json();
    return data;
  } catch (error) {
    console.error('There was a problem with fetch:', error);
    throw error;
  }
}
