from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app) 

METEO_USER = 'amaljyothucollegeofengineering_santhosh_emilv'
METEO_PASS = 'NuRv1197oD3wWV4T3B31'

def get_activity_advice(activity, temp, rain, wind):
    """Generates a simple recommendation based on weather conditions and activity type."""
    activity_lower = activity.lower()
    
    # --- NEW: Check for indoor activities first ---
    indoor_keywords = ['indoor', 'chess', 'carrom', 'video game', 'board game', 'inside']
    if any(keyword in activity_lower for keyword in indoor_keywords):
        return "Since your activity is indoors, the outdoor weather won't affect your plans. Have a great time!"

    # --- Logic for outdoor activities (same as before) ---
    if temp is None: return "Cannot give advice due to missing weather data."

    advice = f"For your outdoor activity '{activity}', here's the forecast: "
    if rain > 1: advice += "Rain is expected, which could impact your plans. Consider a backup. "
    if temp > 35: advice += "It will be very hot. Ensure you have access to shade and water. "
    if wind > 30: advice += "It will be quite windy, which might be an issue. "
    
    if "hike" in activity_lower and rain > 5: advice += "Heavy rain could make trails slippery. "
    if "beach" in activity_lower and temp < 22: advice += "It might be too cool for a comfortable beach day. "
    
    if not (rain > 1 or temp > 35 or wind > 30):
        advice += "Conditions look favorable for your event!"
        
    return advice

@app.route('/api/analyze', methods=['GET'])
def analyze_weather():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    date_str = request.args.get('date')
    activity = request.args.get('activity', 'an outdoor event')

    if not all([lat, lon, date_str]):
        return jsonify({'error': 'Missing required parameters: lat, lon, date'}), 400

    today = datetime.now().date()
    selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    days_diff = (selected_date - today).days

    if days_diff < 0 or days_diff > 15:
        return jsonify({
            'error': 'Forecast data is only available for the next 15 days. Please select a closer date.'
        })

    date_iso = selected_date.strftime('%Y-%m-%dT12:00:00Z')
    parameters = 't_2m:C,precip_24h:mm,wind_speed_10m:kmh'
    location = f"{lat},{lon}"
    url = f"https://api.meteomatics.com/{date_iso}/{parameters}/{location}/json"
    
    try:
        api_response = requests.get(url, auth=(METEO_USER, METEO_PASS)).json()
        if 'data' not in api_response:
             return jsonify({'error': 'Could not retrieve forecast data from the provider.'})

        temp = api_response['data'][0]['coordinates'][0]['dates'][0]['value']
        rain = api_response['data'][1]['coordinates'][0]['dates'][0]['value']
        wind = api_response['data'][2]['coordinates'][0]['dates'][0]['value']

        advice = get_activity_advice(activity, temp, rain, wind)

        response = {
            'source': 'Meteomatics Forecast',
            'advice': advice,
            'details': {'temp': temp, 'rain_mm': rain, 'wind_kph': wind}
        }
        return jsonify(response)

    except Exception as e:
        print(f"Error calling Meteomatics API: {e}")
        return jsonify({'error': 'An error occurred while fetching the forecast.'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)