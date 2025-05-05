from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="GCP Cloud Pricing API",
    description="A FastAPI application to fetch real-time pricing for Google Cloud Platform services",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base URLs for Google Cloud Pricing API
GCP_CATALOG_API_URL = "https://cloudbilling.googleapis.com/v1/services"
GCP_SKU_API_URL = "https://cloudbilling.googleapis.com/v1/services/{}/skus"

# Use API key for authentication (should be stored as environment variable)
API_KEY = os.getenv("GCP_API_KEY", "")

# Response models
class ServiceInfo(BaseModel):
    service_id: str
    display_name: str
    description: str

class PriceInfo(BaseModel):
    sku_id: str
    description: str
    service_display_name: str
    pricing_info: Dict[str, Any]
    service_regions: List[str]
    category: Dict[str, str]

@app.get("/")
async def root():
    return {"message": "GCP Cloud Pricing API is running"}

@app.get("/services", response_model=List[ServiceInfo])
async def get_services():
    """
    Fetch all available GCP services for pricing information
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GCP_CATALOG_API_URL}?key={API_KEY}"
            )
            response.raise_for_status()
            data = response.json()
            
            services = []
            for service in data.get("services", []):
                services.append(
                    ServiceInfo(
                        service_id=service.get("name", "").split("/")[-1],
                        display_name=service.get("displayName", ""),
                        description=service.get("serviceDescription", "")
                    )
                )
            
            return services
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Error fetching GCP services: {str(e)}")

@app.get("/pricing/{service_id}", response_model=List[PriceInfo])
async def get_service_pricing(
    service_id: str,
    region: Optional[str] = Query(None, description="Filter by region code (e.g., 'us-central1')"),
):
    """
    Fetch pricing information for a specific GCP service.
    Optionally filter by region.
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # First, get service details to include display name
            service_response = await client.get(
                f"{GCP_CATALOG_API_URL}/{service_id}?key={API_KEY}"
            )
            service_response.raise_for_status()
            service_data = service_response.json()
            service_display_name = service_data.get("displayName", "Unknown Service")
            
            # Now get SKU pricing information
            response = await client.get(
                f"{GCP_SKU_API_URL.format(service_id)}?key={API_KEY}"
            )
            response.raise_for_status()
            data = response.json()
            
            pricing_info = []
            for sku in data.get("skus", []):
                # Extract regions this SKU applies to
                service_regions = []
                for region_info in sku.get("serviceRegions", []):
                    service_regions.append(region_info)
                
                # Filter by region if specified
                if region and region not in service_regions:
                    continue
                
                # Extract pricing information
                pricing_data = sku.get("pricingInfo", [{}])[0] if sku.get("pricingInfo") else {}
                
                pricing_info.append(
                    PriceInfo(
                        sku_id=sku.get("skuId", ""),
                        description=sku.get("description", ""),
                        service_display_name=service_display_name,
                        pricing_info=pricing_data,
                        service_regions=service_regions,
                        category=sku.get("category", {})
                    )
                )
            
            return pricing_info
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pricing for service {service_id}: {str(e)}")

@app.get("/search", response_model=List[PriceInfo])
async def search_pricing(
    query: str = Query(..., description="Search term for service name or description"),
    region: Optional[str] = Query(None, description="Filter by region code (e.g., 'us-central1')"),
):
    """
    Search for pricing information across GCP services based on a keyword
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        # First get all services
        async with httpx.AsyncClient() as client:
            services_response = await client.get(
                f"{GCP_CATALOG_API_URL}?key={API_KEY}"
            )
            services_response.raise_for_status()
            services_data = services_response.json()
            
            # Find services matching query
            matching_services = []
            query = query.lower()
            for service in services_data.get("services", []):
                service_id = service.get("name", "").split("/")[-1]
                if (query in service.get("displayName", "").lower() or 
                    query in service.get("serviceDescription", "").lower()):
                    matching_services.append(service_id)
        
        # Get pricing for matching services
        all_results = []
        for service_id in matching_services:
            service_prices = await get_service_pricing(service_id, region)
            all_results.extend(service_prices)
        
        return all_results
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Error searching pricing: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)