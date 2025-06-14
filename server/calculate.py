from typing import List, Dict, Any, Optional
import json

class GCPPriceCalculator:
    """
    Utility class to calculate GCP pricing based on usage parameters
    """
    
    @staticmethod
    def calculate_price(pricing_data: List[Dict[str, Any]], vcpus: int, hours: float) -> Dict[str, Any]:
        """
        Calculate price based on GCP pricing data, number of vCPUs, and hours of usage
        
        Args:
            pricing_data: List of pricing information from GCP API
            vcpus: Number of vCPUs
            hours: Number of hours of usage
            
        Returns:
            Dictionary containing calculated pricing information
        """
        results = {
            "input_parameters": {
                "vcpus": vcpus,
                "hours": hours
            },
            "applicable_sku": None,
            "hourly_rate": 0.0,
            "total_cost": 0.0,
            "currency": "USD",
            "details": {}
        }
        
        # Determine which SKU to use based on vCPU count
        applicable_sku = None
        for sku in pricing_data:
            description = sku.get("description", "").lower()
            
            # Check if this is the right SKU based on vCPU count
            if "up to 4 vcpu" in description and vcpus <= 4:
                applicable_sku = sku
                break
            elif "more than 4 vcpu" in description and vcpus > 4:
                applicable_sku = sku
                break
        
        if not applicable_sku:
            return {
                "error": "No applicable SKU found for the specified vCPU count",
                "input_parameters": results["input_parameters"]
            }
        
        # Extract pricing information
        pricing_info = applicable_sku.get("pricing_info", {})
        pricing_expression = pricing_info.get("pricingExpression", {})
        tiered_rates = pricing_expression.get("tieredRates", [])
        
        if not tiered_rates:
            return {
                "error": "No pricing rate information found",
                "input_parameters": results["input_parameters"]
            }
        
        # Calculate cost (using the first tier for simplicity)
        unit_price = tiered_rates[0].get("unitPrice", {})
        units = int(unit_price.get("units", "0"))
        nanos = int(unit_price.get("nanos", 0))
        
        # Convert to decimal
        hourly_rate = units + (nanos / 1_000_000_000)
        total_cost = hourly_rate * hours
        
        # Populate results
        results["applicable_sku"] = {
            "sku_id": applicable_sku.get("sku_id"),
            "description": applicable_sku.get("description")
        }
        results["hourly_rate"] = hourly_rate
        results["total_cost"] = total_cost
        results["currency"] = unit_price.get("currencyCode", "USD")
        results["details"] = {
            "usage_unit": pricing_expression.get("usageUnit"),
            "usage_unit_description": pricing_expression.get("usageUnitDescription"),
            "base_unit": pricing_expression.get("baseUnit"),
            "base_unit_description": pricing_expression.get("baseUnitDescription")
        }
        
        return results

# Example usage
if __name__ == "__main__":
    # Sample data (similar to what you provided)
    sample_data = [
        {
            "sku_id": "10D7-9E13-7F22",
            "description": "Licensing Fee for EDB Postgres Enterprise on VM with up to 4 VCPU",
            "service_display_name": "EnterpriseDB EDB Postgres Enterprise",
            "pricing_info": {
                "pricingExpression": {
                    "usageUnit": "h",
                    "displayQuantity": 1,
                    "tieredRates": [
                        {
                            "startUsageAmount": 0,
                            "unitPrice": {
                                "currencyCode": "USD",
                                "units": "1",
                                "nanos": 80000000
                            }
                        }
                    ],
                    "usageUnitDescription": "hour",
                    "baseUnit": "s",
                    "baseUnitDescription": "second",
                    "baseUnitConversionFactor": 3600
                }
            },
            "service_regions": ["global"],
            "category": {
                "serviceDisplayName": "EnterpriseDB EDB Postgres Enterprise",
                "resourceFamily": "License",
                "resourceGroup": "EnterpriseDB",
                "usageType": "OnDemand"
            }
        },
        {
            "sku_id": "A838-8D91-E2A9",
            "description": "Licensing Fee for EDB Postgres Enterprise on VM with more than 4 VCPU",
            "service_display_name": "EnterpriseDB EDB Postgres Enterprise",
            "pricing_info": {
                "pricingExpression": {
                    "usageUnit": "h",
                    "displayQuantity": 1,
                    "tieredRates": [
                        {
                            "startUsageAmount": 0,
                            "unitPrice": {
                                "currencyCode": "USD",
                                "units": "0",
                                "nanos": 270000000
                            }
                        }
                    ],
                    "usageUnitDescription": "hour",
                    "baseUnit": "s",
                    "baseUnitDescription": "second",
                    "baseUnitConversionFactor": 3600
                }
            },
            "service_regions": ["global"],
            "category": {
                "serviceDisplayName": "EnterpriseDB EDB Postgres Enterprise",
                "resourceFamily": "License",
                "resourceGroup": "EnterpriseDB",
                "usageType": "OnDemand"
            }
        }
    ]
    
    # Calculate for 2 vCPUs running for 730 hours (about a month)
    result = GCPPriceCalculator.calculate_price(sample_data, vcpus=2, hours=730)
    print(json.dumps(result, indent=2))
    
    # Calculate for 8 vCPUs running for 730 hours (about a month)
    result = GCPPriceCalculator.calculate_price(sample_data, vcpus=8, hours=730)
    print(json.dumps(result, indent=2))