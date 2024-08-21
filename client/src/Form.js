import React, { useState } from 'react';
import axios from 'axios';


const serverPort = 5000;

const LineStyle = {
    flexGrow: 1,
    marginRight: '10px',
    padding: '5px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    width: '80%',
    maxWidth: '1000px',
}



export default function URLInputForm() {
    const [urls, setUrls] = useState(['', '', '']);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [metadata, setMetadata] = useState([]);



    const handleChange = (index, event) => {
        const newUrls = [...urls];
        newUrls[index] = event.target.value;
        setUrls(newUrls);
    };

    const handleRemoveUrl = (index) => {
        const newUrls = urls.filter((_, i) => i !== index);
        setUrls(newUrls);
    };

    const handleAddUrl = () => {
        setUrls([...urls, '']);
    };

    const submitting = () =>{
        setSubmitted(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (urls.filter(url => url.trim()).length < 3) {
            setError('Please enter at least 3 URLs.');
        } else {
            setError('');
            setSubmitted(true);
            try {
                // Create and download the JSON file for debugging
                // createJsonFile('toServer.json', urls);

                const response = await axios.post(
                    `http://localhost:${serverPort}/fetch-metadata`,
                    { urls },
                    {
                        withCredentials: true, // Ensure cookies are sent with the request
                    })
                ;

                // console.log("Response is: ", response.data)

                setMetadata(response.data);



            } catch (err) {
                setError('Failed to fetch metadata. Please try again.');

            }
        }
    };

    return (
        <div>
            <h2>Enter URLs</h2>
            <form onSubmit={handleSubmit}>
                {urls.map((url, index) => (
                    <div key={index}>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => handleChange(index, e)}
                            placeholder={`URL ${index + 1}`}
                            style = {LineStyle}
                            required
                        />

                        {index > 2 && (
                            <button type="button" onClick={() => handleRemoveUrl(index)} style={{marginLeft: '20px'}}>
                                Remove line
                            </button>
                        )}

                    </div>
                ))}
                {/*{urls.length < 5 && (*/}
                <button type="button" onClick={handleAddUrl}>Add another URL</button>
                {/*)}*/}
                <button type="submit" onClick={ submitting }>Submit</button>
            </form>
            {submitted && error !== "" && ( // if there is an error
                <div>
                    There was an error ${error}
                </div>
            )}

            {submitted && error === "" && (
                <div className="metadata-container" style={{marginTop: '20px'}}>

                    {metadata.map((item, index) => (
                        <div key={index} className="metadata-card" style={{
                            padding: '20px',
                            border: '1px solid #ccc',
                            borderRadius: '10px',
                            marginBottom: '20px'
                        }}>
                            <img src={item.image} alt={item.title} style={{maxWidth: '30%', borderRadius: '10px'}}/>
                            <h3 style={{marginTop: '10px'}}>{item.title}</h3>
                            <p>{item.description}</p>
                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                               style={{color: '#007BFF', textDecoration: 'none'}}>Visit Site</a>
                        </div>
                    ))}
                </div>
            )}

            {error && <p style={{color: 'red'}}>{error}</p>}
        </div>
    );
}


